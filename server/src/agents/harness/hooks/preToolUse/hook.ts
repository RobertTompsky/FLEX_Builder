import type {
    ResponseFunctionToolCallItem,
} from "openai/resources/responses/responses.js";
import { AgentIdentity, CodeGenSchema } from "../../../shared/schemas";
import { z } from 'zod'

export const PRE_TOOL_USE_HOOK =
    "preToolUse" as const;

export type PreToolUseHookName =
    typeof PRE_TOOL_USE_HOOK;

export type RunTsToolCall = {
    call: ResponseFunctionToolCallItem;
    input: z.infer<typeof CodeGenSchema>
};

export type PreToolUseContext = {
    agent: AgentIdentity;
    toolCalls: RunTsToolCall[];
};

export type PreToolUseResult =
    | {
        decision: "allow";
    }
    | {
        decision: "ask";
        reason?: string;
    }
    | {
        decision: "deny";
        reason: string;
    };

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