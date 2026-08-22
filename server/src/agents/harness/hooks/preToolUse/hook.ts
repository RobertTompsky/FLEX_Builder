import type {
    ResponseFunctionToolCallItem,
} from "openai/resources/responses/responses.js";
import { PreToolUsePolicy } from "@flex-builder/shared/hooks";
import { CodeGenInput, CodeGenSchema } from "@flex-builder/shared/capabilities";
import { AgentIdentity } from "@flex-builder/shared/agent";

export type RunTsToolCall = {
    call: ResponseFunctionToolCallItem;
    input: CodeGenInput
};

type PreToolUseContext = {
    agent: AgentIdentity;
    toolCalls: RunTsToolCall[];
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

type PreToolUseResult =
    PreToolUseResultMap[
    PreToolUsePolicy
    ];

export type PreToolUseHook = (
    context: PreToolUseContext,
) =>
    | PreToolUseResult
    | Promise<PreToolUseResult>;

export function createPreToolUseContext(
    agent: AgentIdentity,
    toolCalls: ResponseFunctionToolCallItem[],
): PreToolUseContext {
    return {
        agent,

        toolCalls: toolCalls.map((call) => ({
            call,

            input: CodeGenSchema.parse(
                JSON.parse(
                    call.arguments ?? "{}",
                ),
            ),
        })),
    };
}