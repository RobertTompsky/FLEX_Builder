
import {
    model,
} from "../llm/model";

import {
    createToolExecutor,
} from "../tools/toolExecutor";

import {
    createPreToolUseContext,
} from "./hooks/preToolUse/hook";

import type {
    AgentConfig,
    AgentResult,
} from "./types";

import type {
    AgentEvent,
} from "@flex-builder/shared/agent";
import { getPendingToolCalls } from "./messages";
import { buildModelTools } from "../tools/buildModelTools";
import { 
    ResponseFunctionToolCallItem, 
    ResponseInputItem 
} from "openai/resources/responses/responses";

type AgentEventHandler = (
    event: AgentEvent,
) => void | Promise<void>;

export async function agent(
    config: AgentConfig,
    onEvent?: AgentEventHandler,
): Promise<AgentResult> {
    const {
        model: modelName,
        tools,
        hooks,
        opts,
    } = config;

    const maxTurns = opts?.maxTurns ?? 3;

    const signal = opts?.signal;

    const messages = [
        ...config.messages,
    ];

    const initialMessagesCount = messages.length;

    throwIfAborted(signal);

    let turnsUsed = 0;

    let pendingToolCalls = getPendingToolCalls(messages);

    const modelTools = buildModelTools(tools);

    const executeTools = createToolExecutor(tools);

    while (true) {
        throwIfAborted(signal);

        if (pendingToolCalls.length > 0) {
            const execution = await executeTools({
                toolCalls: pendingToolCalls,
                signal,
                onEvent,
            });

            messages.push(
                ...execution.output,
            );

            pendingToolCalls = [];

            continue;
        }

        if (turnsUsed >= maxTurns) {
            const finalMessages: ResponseInputItem[] = [
                ...messages,
                {
                    role: "system",
                    content:
                        "The maximum number of agent turns has been reached. " +
                        "Do not call tools. Provide the best final response using " +
                        "the information already available.",
                    status: "completed",
                },
            ];

            const finalStep = await model({
                model: modelName,
                messages: finalMessages,
                tools: [],
                signal,
                onEvent,
            });

            if (finalStep.status !== "completed") {
                throw new Error(
                    "Final model step requested tools while no tools were available",
                );
            }

            messages.push(...finalStep.output);

            return createAgentResult(
                'turn_limit',
                messages,
                initialMessagesCount,
            );
        }

        turnsUsed++;

        const step = await model({
            model: modelName,
            messages,
            tools: modelTools,
            signal,
            reasoning: {
                effort: "none",
            },

            onEvent,
        });

        messages.push(...step.output);

        if (step.status === "completed") {
            return createAgentResult(
                "completed",
                messages,
                initialMessagesCount,
            );
        }

        const toolCalls = step.output.filter(
            (item): item is ResponseFunctionToolCallItem =>
                item.type === "function_call",
        );

        if (toolCalls.length === 0) {
            throw new Error(
                "Model step has status 'tool_calls' but contains no function calls",
            );
        }

        const preToolUseResult = await hooks
            ?.preToolUse?.(
                createPreToolUseContext(
                    toolCalls,
                    tools
                ),
            ) ?? {
            decision: "allow" as const,
        };

        switch (preToolUseResult.decision) {
            case "ask": {
                return createAgentResult(
                    'awaiting_tool_approval',
                    messages,
                    initialMessagesCount,
                );
            }

            case "deny": {
                const deniedOutput = toolCalls.map(
                    (
                        toolCall,
                    ): ResponseInputItem.FunctionCallOutput => ({
                        type: "function_call_output",
                        call_id: toolCall.call_id,
                        output: JSON.stringify({
                            error: "tool_use_denied",
                            reason: preToolUseResult.reason,
                        }),
                    }),
                );

                messages.push(...deniedOutput);

                continue;
            }

            case "allow": {
                pendingToolCalls = toolCalls;

                continue;
            }
        }
    }
}

function throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
        throw new Error("aborted");
    }
}

function createAgentResult(
    status: AgentResult["status"],
    messages: ResponseInputItem[],
    initialMessagesCount: number,
): AgentResult {
    return {
        status,
        output: messages.slice(
            initialMessagesCount,
        ),
    };
}