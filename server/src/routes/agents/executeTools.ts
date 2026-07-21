import { Elysia } from "elysia";
import { z } from 'zod'
import { CodeGenSchema } from "../../llm/agent";
import { executeCode } from "../../code/executeCode";
import { ResponseInputItem } from "openai/resources/responses/responses.js";
import { getPendingToolCalls } from "../../shared/utils/getPendingTools";
import { AgentStore } from "../../agents/store";
import { AgentStreamEvent } from "../../events";
import { streamSSE, createSSEWriter } from "../../shared/utils/streamSSE";
import { buildRuntimeGlobals } from "../../runtime/globals";
import { AgentParamsSchema } from "../schemas";

const ExecuteToolsBodySchema = z.object({
    toolCallIds: z.array(z.string()),
});

// type ExecuteToolsBody = z.infer<
//     typeof ExecuteToolsBodySchema
// >;

export function executeToolsRoute(
    agentStore: AgentStore,
) {
    return new Elysia().post(
        "/:agentId/tool-calls",
        async ({
            body,
            params: { agentId },
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

            const checkpointConfig = snapshot.checkpoint.data.config;

            let history = [
                ...snapshot.checkpoint.data.messages,
            ];

            const pendingTools = getPendingToolCalls(history);

            const approvedTools = pendingTools.filter((tool) =>
                body.toolCallIds.includes(
                    tool.call_id,
                ),
            );

            history = removeRejectedToolCalls({
                history,
                pendingTools,
                approvedTools,
            });

            const globals = buildRuntimeGlobals({
                globals: checkpointConfig.globals,
                skills: checkpointConfig.skills,
            });

            return streamSSE(async (sse) => {
                const writeAgentSSE = createSSEWriter<AgentStreamEvent>(
                    sse,
                    ({ agent, event }) => ({
                        event: event.event,
                        data: {
                            agent,
                            data: event.data,
                        },
                    }),
                );

                for (const tool of approvedTools) {
                    const args = CodeGenSchema.parse(
                        JSON.parse(
                            tool.arguments ?? "{}",
                        ),
                    );

                    const { stdout } = await executeCode(
                        args.code,
                        undefined,
                        globals,
                        async (runtimeEvent) => {
                            if (
                                runtimeEvent.event ===
                                "agent_event"
                            ) {
                                await writeAgentSSE(
                                    runtimeEvent.data,
                                );

                                return;
                            }

                            await writeAgentSSE({
                                agent: snapshot.identity,
                                event: runtimeEvent,
                            });
                        },
                    );

                    const toolMessage: ResponseInputItem.FunctionCallOutput = {
                        type: "function_call_output",
                        call_id: tool.call_id,
                        output: stdout,
                    };

                    history.push(toolMessage);

                    await writeAgentSSE({
                        agent: snapshot.identity,

                        event: {
                            event: "tool_result",
                            data: {
                                callId: tool.call_id,
                                name: tool.name,
                                outputPreview: stdout.slice(0, 2000),
                            },
                        },
                    });
                }

                await agentStore.saveCheckpoint(
                    agentId,
                    {
                        config: checkpointConfig,
                        messages: history
                    }
                );
            });
        },
        {
            params: AgentParamsSchema,
            body: ExecuteToolsBodySchema,
        },
    );
}

type PendingToolCall = ReturnType<
    typeof getPendingToolCalls
>[number];

function removeRejectedToolCalls({
    history,
    pendingTools,
    approvedTools,
}: {
    history: ResponseInputItem[];
    pendingTools: PendingToolCall[];
    approvedTools: PendingToolCall[];
}): ResponseInputItem[] {
    const approvedIds = new Set(
        approvedTools.map(
            (tool) => tool.call_id,
        ),
    );

    const callOutputIds = new Set(
        history
            .filter(
                (
                    message,
                ): message is ResponseInputItem.FunctionCallOutput =>
                    message.type ===
                    "function_call_output",
            )
            .map(
                (message) => message.call_id,
            ),
    );

    const pendingIds = new Set(
        pendingTools.map(
            (tool) => tool.call_id,
        ),
    );

    const removeIndexes = new Set<number>();

    const pendingCallIndexes: number[] = [];

    for (
        let index = 0;
        index < history.length;
        index++
    ) {
        const item = history[index];

        if (
            item.type === "function_call" &&
            pendingIds.has(item.call_id)
        ) {
            pendingCallIndexes.push(index);
        }

        if (
            item.type !== "function_call"
        ) {
            continue;
        }

        const keep =
            callOutputIds.has(item.call_id) ||
            approvedIds.has(item.call_id);

        if (!keep) {
            removeIndexes.add(index);
        }
    }

    const batchStart = pendingCallIndexes[0];

    if (
        approvedIds.size === 0 &&
        batchStart !== undefined
    ) {
        const previousItem = history[batchStart - 1];

        if (
            previousItem?.type ===
            "reasoning"
        ) {
            removeIndexes.add(
                batchStart - 1,
            );
        }
    }

    return history.filter(
        (_, index) =>
            !removeIndexes.has(index),
    );
}