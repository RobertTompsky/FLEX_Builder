import Elysia from "elysia";
import path from "path";
import fs from "fs-extra";
import type {
    ResponseInputItem,
} from "openai/resources/responses/responses.js";
import { z } from "zod";

import type {
    RunStore,
} from "../../agents/store/runs";

import type {
    AgentStore,
} from "../../agents/store/store";

import {
    AGENTS_STORE_DIR,
    SKILLS_DIR,
    UPLOADS_DIR,
} from "../../shared/data";

import {
    createSSEWriter,
    streamSSE,
} from "../../shared/utils/streamSSE";

import {
    agent,
} from "../../agents/harness/agent";

import type {
    AgentRunConfig,
} from "../../agents/harness/agent";

import {
    createHooks,
} from "../../agents/harness/hooks/createHooks";

import {
    getSkillsRegistry,
} from "../../skills/getSkillsRegistry";

import {
    buildRuntimeGlobals,
} from "../../runtime/globals/buildRuntimeGlobals";

import type {
    AgentEnvelopeEvent,
} from "../../agents/events";

import {
    RuntimeGlobalNameSchema,
} from "../../runtime/globals/registry";

import {
    AgentParamsSchema,
    AgentRunParamsSchema,
} from "../schemas";
import { AgentCheckpointConfigSchema, createCheckpointer } from "../../agents/store/checkpointer";
import { getAgentWorkspacePaths } from "../../agents/shared/utils/workspace";
import { randomUUID } from "crypto";
import { AgentIdentity } from "../../agents/shared/schemas";

const skillsRegistry = getSkillsRegistry(SKILLS_DIR);

const skillNames = skillsRegistry.map(
    (skill) => skill.name,
) as [string, ...string[]];

const ExecuteAgentBodySchema =
    AgentCheckpointConfigSchema.extend({
        query: z.string().nullable(),
        files: z.array(z.string()).optional(),

        globals: z.array(
            RuntimeGlobalNameSchema,
        ),

        skills: z.array(
            z.enum(skillNames),
        ),
    });

export function executeAgentRoute(
    agentStore: AgentStore,
    runStore: RunStore,
) {
    return new Elysia().post(
        "/:agentId/runs",
        async ({
            body,
            params: {
                agentId,
            },
            request,
            set,
        }) => {
            const {
                query,
                files,
                ...checkpointConfig
            } = body;

            const snapshot = await agentStore.get(agentId);

            if (!snapshot) {
                set.status = 404;

                return {
                    ok: false,
                    error: "Agent not found",
                };
            }

            const { state: checkpointState } = snapshot.checkpoint.data;

            const isResume = query === null;

            if (
                isResume &&
                !checkpointState.activeRequest
            ) {
                set.status = 409;

                return {
                    ok: false,
                    error:
                        "No active request to resume",
                };
            }

            if (
                !isResume &&
                checkpointState.activeRequest
            ) {
                set.status = 409;

                return {
                    ok: false,
                    error:
                        "Agent already has an active request",
                };
            }

            const workspace = getAgentWorkspacePaths(
                AGENTS_STORE_DIR,
                agentId,
            );

            const checkpointer = createCheckpointer(workspace.root);

            const runId = `run_${randomUUID()}`;
            const controller = new AbortController();

            const hooks = createHooks(checkpointConfig.policies);

            const history = snapshot.checkpoint.data.state.messages
                .filter(
                    (message) =>
                        !(
                            "role" in message &&
                            message.role === "system"
                        ),
                );

            const filesContext = await buildFilesContext(files);

            const globals = buildRuntimeGlobals({
                globals: checkpointConfig.globals,
                skills: checkpointConfig.skills,
            });

            const messages = buildRunMessages({
                history,
                query,
                prompt: checkpointConfig.prompt,
                filesContext,
                isResume,
            });

            const activeRequest =
                isResume
                    ? {
                        ...checkpointState
                            .activeRequest!,
                    }
                    : {
                        id: `request_${randomUUID()}`,
                        turnsUsed: 0,
                    };

            const runConfig: AgentRunConfig = {
                runId,
                model: checkpointConfig.model,
                state: {
                    messages,
                    activeRequest,
                },
                globals,
                hooks,
                opts: {
                    maxTurns: checkpointConfig.maxTurns,

                    signal: controller.signal,
                },
            };

            /*
            * Между проверкой и регистрацией не должно
            * быть await.
            */
            if (runStore.has(agentId)) {
                set.status = 409;

                return {
                    ok: false,
                    error: "Agent already has an active run",
                };
            }

            runStore.set(
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
                const writeAgentSSE = createSSEWriter<AgentEnvelopeEvent>(
                    stream,
                    ({ agent, event }) => ({
                        event: event.event,
                        data: {
                            agent,
                            data: event.data,
                        },
                    }),
                );

                try {
                    const result = await agent(
                        runConfig,
                        snapshot.identity,
                        writeAgentSSE,
                    );

                    if (!controller.signal.aborted) {
                        const activeRequest =
                            result.status ===
                                "awaiting_tool_approval"
                                ? result
                                    .state
                                    .activeRequest
                                : null;

                        await checkpointer.save({
                            config:
                                checkpointConfig,

                            state: {
                                ...result.state,
                                activeRequest,
                            },
                        });
                    }
                } finally {
                    request.signal.removeEventListener(
                        "abort",
                        abortFromRequest,
                    );

                    runStore.delete(
                        agentId,
                        runId,
                    );
                }
            });
        },
        {
            params: AgentParamsSchema,
            body: ExecuteAgentBodySchema,
        },
    );
}

function buildRunMessages({
    history,
    query,
    prompt,
    filesContext,
    isResume,
}: {
    history: ResponseInputItem[];
    query: string | null;
    prompt: string;
    filesContext: string;
    isResume: boolean;
}): ResponseInputItem[] {
    const systemContent = [
        prompt,

        filesContext
            ? [
                "Attached files:",
                filesContext,
            ].join("\n")
            : "",
    ]
        .filter(Boolean)
        .join("\n\n");

    const systemMessage: ResponseInputItem = {
        role: "system",
        content: systemContent,
        status: "completed",
    };

    if (isResume) {
        return [
            ...history,
            systemMessage,
        ];
    }

    const userMessage: ResponseInputItem = {
        role: "user",
        content: query ?? "",
        status: "completed",
    };

    return [
        ...history,
        systemMessage,
        userMessage,
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