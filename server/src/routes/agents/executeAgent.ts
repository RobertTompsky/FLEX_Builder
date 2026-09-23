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
import { ToolRegistry } from "../../services/tools/types";
import { createRunTsTool } from "../../tools/runTsTool/createRunTsTool";
import { buildRunTsDescription } from "../../tools/runTsTool/buildDescription";
import { agent } from "../../services/agent/agent";
import { createHooks } from "../../services/agent/hooks/createHooks";
import { getPendingToolCalls } from "../../services/agent/messages";
import { SandboxEvent } from "@flex-builder/shared/sandbox";
import { createCapabilities } from "../../capabilities";
import {
    resolveExecutableCapabilities,
    resolvePromptCapabilities
} from "../../tools/runTsTool/resolveRunCapabilties";
import { chromium } from "playwright";

const env = {
    coinMarketCapApiKey: process.env.COIN_MARKET_CAP_API_KEY ?? ""
}

let browserPromise:
    ReturnType<typeof chromium.launch>
    | undefined;

function getBrowser() {
    browserPromise ??= chromium.launch({
        headless: true,
    });

    return browserPromise;
}

export async function closeExecuteAgentResources() {
    if (!browserPromise) {
        return;
    }

    const browser = await browserPromise;

    await browser.close();

    browserPromise = undefined;
}

export function executeAgentRoute(
    deps: RouteDeps,
) {
    return new Elysia()
        .post(
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
                    capabilities: capabilityConfigs,
                    policies,
                } = body;

                const agentRecord = await deps.agentRepository
                    .get(agentId);

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

                if (deps.runStore.has(agentId, chatId)) {
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

                const runId = `run_${randomUUID()}`;

                const controller = new AbortController();

                const hooks = createHooks(policies);

                deps.runStore.set(
                    agentId,
                    chatId,
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
                        once:
                            true,
                    },
                );

                return streamSSE(async (stream) => {
                    const writeSSE = createSSEWriter<AgentSSEMessage>(stream);

                    const emitAgentEvent = async (event: AgentEvent) => {
                        await writeSSE(
                            toAgentSSEMessage(
                                agentRecord
                                    .identity,

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
                        const browser = await getBrowser();

                        const availableCapabilities = createCapabilities({
                            workspace,
                            browser,
                            env,
                        });

                        const executableCapabilities = resolveExecutableCapabilities(
                            capabilityConfigs,
                            availableCapabilities,
                        );

                        const promptCapabilities = resolvePromptCapabilities(
                            capabilityConfigs,
                            availableCapabilities,
                        );

                        const description = buildRunTsDescription(promptCapabilities);

                        const tools: ToolRegistry = [
                            createRunTsTool({
                                runId,
                                workspace,
                                description,
                                capabilities: executableCapabilities,
                                runtime: deps.sandboxService.runtime,
                                onEvent: emitSandboxEvent,
                            })
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
                            await deps.chatRepository
                                .appendItems(
                                    chatId,
                                    result.output,
                                );
                        }
                    } finally {
                        request.signal.removeEventListener(
                            "abort",
                            abortFromRequest,
                        );

                        deps.runStore.delete(
                            agentId,
                            chatId,
                            runId,
                        );
                    }
                },
                );
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