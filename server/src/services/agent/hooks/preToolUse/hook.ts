import type {
    ResponseFunctionToolCallItem,
} from "openai/resources/responses/responses.js";
import { PreToolUsePolicy } from "@flex-builder/shared/hooks";
import type { Tool, ToolRegistry } from "../../../tools/types";
import { resolveToolCall } from "../../../tools/resolveToolCall";

export type PreToolUseCall = {
    callId: string;
    name: string;
    args: unknown;
};

export type PreToolUseContext = {
    toolCalls: PreToolUseCall[];
};

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
    PreToolUsePolicy
    ];

export type PreToolUseHook = (
    context: PreToolUseContext,
) =>
    | PreToolUseResult
    | Promise<PreToolUseResult>;

export function createPreToolUseContext(
    toolCalls:
        ResponseFunctionToolCallItem[],
    tools:
        ToolRegistry,
): PreToolUseContext {
    return {
        toolCalls:
            toolCalls.map(
                (call) => {
                    const {
                        args,
                    } =
                        resolveToolCall(
                            call,
                            tools,
                        );

                    return {
                        callId:
                            call.call_id,
                        name:
                            call.name,
                        args,
                    };
                },
            ),
    };
}