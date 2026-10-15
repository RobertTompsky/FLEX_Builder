import type {
    ResponseFunctionToolCallItem,
} from "openai/resources/responses/responses";
import { PreToolUsePolicy } from "@flex-builder/shared/hooks";
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

export type PreToolUseDecision =
    | "allow"
    | "ask"
    | "deny";

type PreToolUseResultMap = {
    allow: {
        decision: "allow";
    };
    ask: {
        decision: "ask";
        reason?: string;
    };
    deny: {
        decision: "deny";
        reason: string;
    };
};

export type PreToolUseResult =
    PreToolUseResultMap[
    PreToolUseDecision
    ];

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