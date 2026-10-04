import Elysia from "elysia";
import path from "path";
import fs from "fs-extra";

import type {
    ResponseInputItem,
} from "openai/resources/responses/responses";

import {
    createSSEWriter,
    streamSSE,
} from "../../../sse";

import {
    UPLOADS_DIR,
} from "../../../shared/data";

import {
    AgentEvent,
    AgentSSEMessage,
    toAgentSSEMessage,
} from "@flex-builder/shared/agent";

import { RouteDeps } from "../../types";
import { agent } from "../../../services/agent/agent";
import { createHooks } from "../../../services/agent/hooks/createHooks";
import { getPendingToolCalls } from "../../../services/agent/messages";
import { SandboxEvent } from "@flex-builder/shared/sandbox";
import { createAgentTools } from "../../../services/agent/tools/createTools";
import { RunTsRuntime } from "../../../tools/runTsTool/types";
import {
    type RunEvent,
    StartRunBodySchema,
    StartRunParamsSchema
} from "@flex-builder/shared/run";

export function startRunRoute(
    deps: RouteDeps,
) {
    return new Elysia()
        .post(
            "/:agentId/chats/:chatId/runs",

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
                    capabilities: capabilityConfigs,
                    maxExecuteConcurrency,
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

                if (deps.runRegistry.has(agentId, chatId)) {
                    set.status = 409;

                    return {
                        ok: false,
                        error: "Agent already has an active run",
                    };
                }

                if (query !== null) {
                    await deps.chatRepository
                        .appendItems(
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

                if (
                    isResume &&
                    pendingToolCalls.length === 0
                ) {
                    set.status = 400;

                    return {
                        ok: false,
                        error: "Nothing to resume",
                    };
                }

                const workspace = deps.workspaceStore
                    .chat
                    .get(agentId, chatId);

                const filesContext = await buildFilesContext(files);

                const messages = buildRunMessages({
                    history,
                    prompt,
                    filesContext,
                });

                const run = await deps.runRepository.create(chatId);

                const controller = new AbortController();

                const hooks = createHooks(policies);

                deps.runRegistry.set(
                    agentId,
                    chatId,
                    run.id,
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

                    const emitRunEvent = async (event: RunEvent) => {
                        await writeSSE(
                            toAgentSSEMessage(
                                agentRecord.identity,
                                event,
                            ),
                        );
                    };

                    const emitAgentEvent = async (event: AgentEvent) => {
                        await writeSSE(
                            toAgentSSEMessage(
                                agentRecord.identity,
                                event,
                            ),
                        );
                    };

                    const emitSandboxEvent = async (event: SandboxEvent) => {
                        await writeSSE(toAgentSSEMessage(
                            agentRecord.identity,
                            event,
                        ));
                    };

                    try {
                        const runtime: RunTsRuntime = {
                            sandbox: deps.sandboxService.client,
                            executions: deps.executionService.executions,
                        };

                        const tools = createAgentTools({
                            runId: run.id,
                            workspace,
                            capabilities: capabilityConfigs,
                            maxExecuteConcurrency: maxExecuteConcurrency ?? 5,
                            runtime,
                            onEvent: emitSandboxEvent,
                        });

                        await emitRunEvent({
                            event: "status",
                            data: {
                                runId: run.id,
                                status: 'running'
                            },
                        });

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
                            await deps.chatRepository
                                .appendItems(
                                    chatId,
                                    result.output,
                                );
                        }

                        if (result.status === "awaiting_tool_approval") {
                            await deps.runRepository
                                .updateStatus(
                                    run.id,
                                    "paused",
                                );

                            await emitRunEvent({
                                event: "status",
                                data: {
                                    runId: run.id,
                                    status: "paused",
                                    reason: "tool_approval_required",
                                },
                            });

                            return;
                        }

                        await deps.runRepository.updateStatus(
                            run.id,
                            "completed",
                        );

                        await emitRunEvent({
                            event: "status",
                            data: {
                                runId: run.id,
                                status: "completed",
                            },
                        });
                    } catch (error) {
                        const status = controller.signal.aborted
                            ? "stopped"
                            : "failed";

                        await deps.runRepository.updateStatus(
                            run.id,
                            status,
                        );

                        const reason = controller.signal.reason;

                        const reasonMessage = reason instanceof Error
                            ? reason.message
                            : undefined;

                        await emitRunEvent({
                            event: "status",
                            data: {
                                runId: run.id,
                                status,
                                reason: reasonMessage,
                            },
                        });
                    } finally {
                        request.signal.removeEventListener(
                            "abort",
                            abortFromRequest,
                        );

                        deps.runRegistry.delete(
                            agentId,
                            chatId,
                            run.id,
                        );
                    }
                },
                );
            },

            {
                params: StartRunParamsSchema,
                body: StartRunBodySchema,
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
                content: await fs.readFile(filePath, "utf8"),
            };
        }),
    );

    return JSON.stringify(
        fileContents,
        null,
        2,
    );
}