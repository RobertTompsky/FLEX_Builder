import Elysia from "elysia";
import path from "path";
import fs from "fs-extra";
import { randomUUID } from "crypto";

import type {
    ResponseInputItem,
} from "openai/resources/responses/responses.js";

import type {
    RunStore,
} from "../../agents/store/runs";

import {
    createSSEWriter,
    streamSSE,
} from "../../sse";

import {
    agent,
    type AgentRunConfig,
} from "../../agents/harness/agent";

import {
    createHooks,
} from "../../agents/harness/hooks/createHooks";

import {
    getAgentWorkspacePaths,
    getPendingToolCalls,
} from "../../agents/shared";

import {
    AGENTS_STORE_DIR,
    Model,
    UPLOADS_DIR,
} from "../../shared/data";

import {
    AgentSSEMessage,
    ExecuteAgentBodySchema,
    ExecuteAgentParamsSchema,
} from "@flex-builder/shared/agent";

import {
    AgentRepository,
} from "../../db/agents/repository";

import {
    CapabilityRepository,
} from "../../db/capabilities";
import { RouteDeps } from "../types";

type ExecuteAgentRouteDeps = Pick<RouteDeps, 'agentRepository' | 'capabilityRepository' | 'chatRepository' | 'runStore'>
export function executeAgentRoute(
    deps: ExecuteAgentRouteDeps,
) {
    return new Elysia().post(
        "/:agentId/conversations/:conversationId",
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
                ...requestConfig
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

            const capabilities = await deps.capabilityRepository
                .getByAgentId(agentId);

            const workspace = getAgentWorkspacePaths(
                AGENTS_STORE_DIR,
                agentId,
            );

            const filesContext = await buildFilesContext(files);

            const messages =
                buildRunMessages({
                    history,
                    query,
                    prompt: agentRecord.config.prompt,
                    filesContext,
                });

            const runId = `run_${randomUUID()}`;

            const controller = new AbortController();

            const hooks = createHooks(requestConfig.policies);

            const runConfig: AgentRunConfig = {
                model: agentRecord.config.model as Model,

                messages,

                capabilities,

                runtime: {
                    runId,
                    agentId,
                    workspaceRoot: workspace.root,
                },

                hooks,

                opts: {
                    maxTurns: agentRecord.config.maxTurns,
                    signal: controller.signal,
                },
            };

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
                const writeAgentSSE = createSSEWriter<AgentSSEMessage>(stream);

                try {
                    const result = await agent(
                        runConfig,
                        agentRecord.identity,
                        writeAgentSSE,
                    );

                    if (!controller.signal.aborted) {
                        await deps.chatRepository.appendItems(
                            chatId,
                            result.messages.filter(
                                (item) =>
                                    !(
                                        "role" in item &&
                                        item.role === "system"
                                    ),
                            )
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
    query,
    prompt,
    filesContext,
}: {
    history: ResponseInputItem[];
    query: string | null;
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

    if (query === null) {
        return [
            systemMessage,
            ...history,
        ];
    }

    return [
        systemMessage,
        ...history,
        {
            role: "user",
            content: query,
            status: "completed",
        },
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
            const safeFilename =
                path.basename(filename);

            const filePath = path.join(
                UPLOADS_DIR,
                safeFilename,
            );

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