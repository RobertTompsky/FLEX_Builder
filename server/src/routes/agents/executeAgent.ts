import Elysia from "elysia";
import path from "path";
import fs from "fs-extra";
import { randomUUID } from "crypto";

import type {
    ResponseInputItem,
} from "openai/resources/responses/responses.js";

import {
    createSSEWriter,
    streamSSE,
} from "../../sse";

import {
    UPLOADS_DIR,
} from "../../shared/data";

import {
    AgentEvent,
    AgentSSEMessage,
    ExecuteAgentBodySchema,
    ExecuteAgentParamsSchema,
    toAgentSSEMessage,
} from "@flex-builder/shared/agent";

import { RouteDeps } from "../types";
import { AGENT_WORKSPACES_DIR, ensureWorkspace, getWorkspace } from "../../services/workspace";
import { ToolRegistry } from "../../services/tools/types";
import { createRunTsTool } from "../../tools/runTsTool/createRunTsTool";
import { SandboxEvent } from "../../tools/runTsTool/types";
import { resolvePromptCapabilities, resolveRunCapabilities } from "../../tools/runTsTool/resolveRunCapabilties";
import { buildRunTsDescription } from "../../tools/runTsTool/buildDescription";
import { AgentCapabilityConfig } from "@flex-builder/shared/capabilities";
import { CreateSubagentTools } from "../../capabilities/subagent/actions/runSubagent";
import { agent } from "../../services/agent/agent";
import { createHooks } from "../../services/agent/hooks/createHooks";
import { getPendingToolCalls } from "../../services/agent/messages";

export function executeAgentRoute(
    deps: RouteDeps,
) {
    return new Elysia().post(
        "/:agentId/chats/:chatId",
        async ({
            body,
            params: {
                agentId,
                chatId,
            },
            request,
            set,
        }) => {
            const {
                query,
                files,
                model,
                prompt,
                maxTurns,
                capabilities,
                policies,
            } = body;

            const agentRecord = await deps.agentRepository.get(agentId);

            if (!agentRecord) {
                set.status = 404;

                return {
                    ok: false,
                    error: "Agent not found",
                };
            }

            const chat = await deps.chatRepository.get(chatId);

            if (!chat) {
                set.status = 404;

                return {
                    ok: false,
                    error: "Conversation not found",
                };
            }

            if (deps.runStore.has(agentId)) {
                set.status = 409;

                return {
                    ok: false,
                    error: "Agent already has an active run",
                };
            }

            if (query !== null) {
                await deps.chatRepository.appendItems(
                    chatId,
                    [
                        {
                            role: "user",
                            content: query,
                            status: "completed",
                        },
                    ],
                );
            }

            const history = await deps.chatRepository.getItems(chatId);

            const pendingToolCalls = getPendingToolCalls(history);

            const isResume = query === null;

            if (isResume && pendingToolCalls.length === 0) {
                set.status = 400;

                return {
                    ok: false,
                    error: "Nothing to resume",
                };
            }

            const workspace = getWorkspace(AGENT_WORKSPACES_DIR, agentId);

            await ensureWorkspace(workspace);

            const filesContext = await buildFilesContext(files);

            const messages =
                buildRunMessages({
                    history,
                    prompt,
                    filesContext,
                });

            const runId = `run_${randomUUID()}`;

            const controller = new AbortController();

            const hooks = createHooks(policies);

            deps.runStore.set(
                agentId,
                runId,
                controller,
            );

            const abortFromRequest = () => {
                controller.abort();
            };

            request.signal.addEventListener(
                "abort",
                abortFromRequest,
                {
                    once: true,
                },
            );

            return streamSSE(async (stream) => {
                const writeSSE = createSSEWriter<AgentSSEMessage>(stream);

                const emitAgentEvent = async (event: AgentEvent) => {
                    await writeSSE(toAgentSSEMessage(
                        agentRecord.identity,
                        event
                    ));
                };

                const emitSandboxEvent = async (event: SandboxEvent) => {
                    await writeSSE(
                        toAgentSSEMessage(
                            agentRecord.identity,
                            event,
                        ),
                    );
                };

                const createSubagentTools: CreateSubagentTools =
                    (
                        capabilityIds,
                        subagentWorkspace,
                        subagentRunId,
                    ) => {
                        const configs: AgentCapabilityConfig[] =
                            capabilityIds.map(
                                (id) => ({
                                    id,
                                    access: "execute",
                                }),
                            );

                        const description = buildRunTsDescription(
                            resolvePromptCapabilities(
                                configs
                            )
                        );

                        return [
                            createRunTsTool({
                                runId: subagentRunId,
                                workspace: subagentWorkspace,
                                description,
                                resolveCapabilities: (source) =>
                                    resolveRunCapabilities({
                                        configs,
                                        workspace: subagentWorkspace,
                                        source,
                                        createSubagentTools,
                                        onEvent: emitSandboxEvent
                                    }),

                                onEvent: emitSandboxEvent,
                            }),
                        ];
                    };

                try {
                    const description =
                        buildRunTsDescription(
                            resolvePromptCapabilities(
                                capabilities
                            ),
                        );

                    const tools: ToolRegistry = [
                        createRunTsTool({
                            runId,
                            workspace,
                            description,

                            resolveCapabilities: (source) =>
                                resolveRunCapabilities({
                                    configs: capabilities,
                                    workspace,
                                    source,
                                    createSubagentTools,
                                    onEvent: emitSandboxEvent,
                                }),

                            onEvent: emitSandboxEvent,
                        }),
                    ];

                    const result = await agent(
                        {
                            model,
                            messages,
                            tools,
                            hooks,

                            opts: {
                                maxTurns,
                                signal: controller.signal,
                            },
                        },

                        emitAgentEvent,
                    );

                    if (
                        !controller.signal.aborted &&
                        result.output.length > 0
                    ) {
                        await deps.chatRepository.appendItems(
                            chatId,
                            result.output
                        );
                    }
                } finally {
                    request.signal.removeEventListener(
                        "abort",
                        abortFromRequest,
                    );

                    deps.runStore.delete(
                        agentId,
                        runId,
                    );
                }
            });
        },
        {
            params: ExecuteAgentParamsSchema,
            body: ExecuteAgentBodySchema,
        },
    );
}

function buildRunMessages({
    history,
    prompt,
    filesContext,
}: {
    history: ResponseInputItem[];
    prompt: string;
    filesContext: string;
}): ResponseInputItem[] {
    const systemMessage: ResponseInputItem = {
        role: "system",
        content: [
            prompt,
            filesContext
                ? [
                    "Attached files:",
                    filesContext,
                ].join("\n")
                : "",
        ]
            .filter(Boolean)
            .join("\n\n"),
        status: "completed",
    };

    return [
        systemMessage,
        ...history,
    ];
}

async function buildFilesContext(
    files?: string[],
): Promise<string> {
    if (!files?.length) {
        return "";
    }

    const fileContents = await Promise.all(
        files.map(async (filename) => {
            const safeFilename = path.basename(filename);

            const filePath = path.join(UPLOADS_DIR, safeFilename);

            return {
                filename: safeFilename,
                content: await fs.readFile(
                    filePath,
                    "utf8",
                ),
            };
        }),
    );

    return JSON.stringify(
        fileContents,
        null,
        2,
    );
}