import type {
    ResponseFunctionToolCallItem,
} from "openai/resources/responses/responses";
import { PreToolUseResult } from "@flex-builder/shared/hooks";
import type { Tool } from "../../../tools/types";
import { resolveToolCall } from "../../../tools/resolveToolCall";

export type PreToolUseCall = {
    callId: string;
    name: string;
    description: string;
    args: unknown;
};

export type PreToolUseContext = {
    toolCalls: PreToolUseCall[];
};

export type PreToolUseHook = (
    context: PreToolUseContext,
) =>
    | PreToolUseResult
    | Promise<PreToolUseResult>;

export function createPreToolUseContext(
    toolCalls: ResponseFunctionToolCallItem[],
    tools: Tool[],
): PreToolUseContext {
    return {
        toolCalls: toolCalls.map(
            (call) => {
                const { tool, args } = resolveToolCall(call, tools);

                return {
                    callId: call.call_id,
                    name: call.name,
                    description: tool.description,
                    args,
                };
            },
        ),
    };
}