import type {
    ResponseFunctionToolCallItem,
    ResponseInputItem,
} from "openai/resources/responses/responses.js";

import type {
    ToolRegistry,
} from "./types";
import { ToolExecutorEvent } from "@flex-builder/shared/agent";
import { resolveToolCall } from "./resolveToolCall";

export type ToolExecutorInput = {
    toolCalls: ResponseFunctionToolCallItem[];
    signal?: AbortSignal;
    onEvent?: (
        event: ToolExecutorEvent,
    ) => void | Promise<void>;
};

export type ToolExecutorResult = {
    output: ResponseInputItem.FunctionCallOutput[];
};

export function createToolExecutor(tools: ToolRegistry) {
    return async function toolExecutor({
        toolCalls,
        signal,
        onEvent,
    }: ToolExecutorInput): Promise<ToolExecutorResult> {
        const output: ResponseInputItem.FunctionCallOutput[] = [];

        for (const toolCall of toolCalls) {
            throwIfAborted(signal);

            await onEvent?.({
                event: "tool_start",
                data: {
                    callId: toolCall.call_id,
                    name: toolCall.name,
                },
            });

            try {
                const {
                    tool,
                    args,
                } = resolveToolCall(
                    toolCall,
                    tools,
                );

                const result = await tool.execute(
                    args,
                    {
                        callId: toolCall.call_id,
                        signal,
                    },
                );

                const serialized = serializeToolResult(result);

                output.push({
                    type: "function_call_output",
                    call_id: toolCall.call_id,
                    output: serialized,
                });

                await onEvent?.({
                    event: "tool_result",
                    data: {
                        callId: toolCall.call_id,
                        name: toolCall.name,
                        outputPreview:
                            serialized.slice(
                                0,
                                2000,
                            ),
                    },
                });
            } catch (error) {
                if (signal?.aborted) {
                    throw error;
                }

                const message = error instanceof Error
                    ? error.message
                    : String(error);

                const serialized = JSON.stringify({
                    ok: false,
                    error: message,
                });

                output.push({
                    type: "function_call_output",
                    call_id: toolCall.call_id,
                    output: serialized,
                });

                await onEvent?.({
                    event: "tool_result",
                    data: {
                        callId: toolCall.call_id,
                        name: toolCall.name,
                        outputPreview: serialized.slice(0, 2000),
                    },
                });
            }
        }

        return {
            output,
        };
    };
}

function serializeToolResult(result: unknown): string {
    if (typeof result === "string") return result;

    return JSON.stringify(result);
}

function throwIfAborted(
    signal?: AbortSignal,
): void {
    if (
        signal?.aborted
    ) {
        throw new Error(
            "aborted",
        );
    }
}