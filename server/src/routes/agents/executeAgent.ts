import Elysia from 'elysia';
import path from 'path'
import fs from 'fs-extra'
import { ResponseInputItem } from 'openai/resources/responses/responses.js';
import { z } from "zod";
import { RunStore } from '../../agents/runs';
import { AgentRunParamsSchema, AgentCheckpointConfig } from '../../agents/schemas';
import { AgentStore } from '../../agents/store';
import { SKILLS_DIR, UPLOADS_DIR } from '../../data';
import { createSSEWriter, streamSSE } from '../../lib/utils/streamSSE';
import { AgentRunConfig, agent } from '../../llm/agent';
import { getSkillsRegistry } from '../../skills/getSkillsRegistry';
import { RuntimeGlobalNameSchema } from '../../runtime/globals';
import { RuntimeGlobal } from '../../runtime/types';
import { AgentStreamEvent } from '../../events';

const skillsRegistry = getSkillsRegistry(SKILLS_DIR);

const skillNames = skillsRegistry.map(
    (skill) => skill.name,
) as [string, ...string[]];

const ExecuteAgentBodySchema = z.object({
    query: z.string().nullable(),
    model: z.string().min(1),
    prompt: z.string().optional(),
    files: z
        .array(z.string())
        .optional(),
    toolRounds: z
        .number()
        .int()
        .positive()
        .optional(),
    globals: z
        .array(RuntimeGlobalNameSchema)
        .optional(),
    skills: z
        .array(z.enum(skillNames))
        .optional(),
    pause: z.boolean().optional(),
});

export function executeAgentRoute(
    agentStore: AgentStore,
    runStore: RunStore,
) {
    return new Elysia().post(
        "/:agentId/runs/:runId",
        async ({
            body,
            params: {
                agentId,
                runId,
            },
            request,
            set,
        }) => {
            const snapshot = await agentStore.get(agentId);

            if (!snapshot) {
                set.status = 404;

                return {
                    ok: false,
                    error: "Agent not found",
                };
            }

            if (
                runStore.get(agentId, runId) !==
                undefined
            ) {
                set.status = 409;

                return {
                    ok: false,
                    error: "Run is already active",
                };
            }

            const controller = new AbortController();

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

            runStore.set(
                agentId,
                runId,
                controller,
            );

            const checkpointConfig = createCheckpointConfig(body);

            const history = snapshot.checkpoint.data.messages.filter(
                (message) =>
                    !(
                        "role" in message &&
                        message.role === "system"
                    ),
            );

            const isResume = body.query === null;

            const filesContext = await buildFilesContext(body.files);

            const globals = buildRuntimeGlobals({
                globals: checkpointConfig.globals,
                skills: checkpointConfig.skills,
            });

            const messages = buildRunMessages({
                history,
                query: body.query,
                prompt: checkpointConfig.prompt,
                filesContext,
                isResume,
            });

            const runConfig: AgentRunConfig = {
                model: checkpointConfig.model,
                messages,
                globals,
                pause: checkpointConfig.pause,
                opts: {
                    toolRounds: checkpointConfig.toolRounds,
                    signal: controller.signal,
                },
            };

            return streamSSE(async (stream) => {
                const writeAgentSSE = createSSEWriter<AgentStreamEvent>(
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
                        await agentStore.saveCheckpoint(
                            agentId,
                            {
                                config: checkpointConfig,
                                messages: result.messages,
                            }
                        );
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
            params: AgentRunParamsSchema,
            body: ExecuteAgentBodySchema,
        },
    );
}

type ExecuteAgentBody = z.infer<
    typeof ExecuteAgentBodySchema
>;

function createCheckpointConfig(
    body: ExecuteAgentBody,
): AgentCheckpointConfig {
    return {
        model: body.model,
        prompt: body.prompt ?? "",
        toolRounds: body.toolRounds ?? 3,
        globals: body.globals ?? [],
        skills: body.skills ?? [],
        pause: body.pause ?? false,
    };
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

function buildRuntimeGlobals({
    globals: selectedNames,
    skills: selectedSkillNames,
}: {
    globals: z.infer<typeof RuntimeGlobalNameSchema>[];
    skills: string[];
}): RuntimeGlobal[] {
    const selectedGlobals = new Set(
        selectedNames,
    );

    const availableSkills =
        skillsRegistry.filter((skill) =>
            selectedSkillNames.includes(
                skill.name,
            ),
        );

    const globals: RuntimeGlobal[] = [];

    if (
        selectedGlobals.has("artifact")
    ) {
        globals.push({
            name: "artifact",
        });
    }

    if (
        selectedGlobals.has("execute")
    ) {
        globals.push({
            name: "execute",
            baseDir: SKILLS_DIR,
            available: availableSkills,
        });
    }

    if (
        selectedGlobals.has("subagent")
    ) {
        globals.push({
            name: "subagent",
            baseDir: SKILLS_DIR,
            available: availableSkills,
        });
    }

    return globals;
}