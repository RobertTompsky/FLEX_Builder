import {
    PRE_TOOL_USE_POLICIES,
    PRE_TOOL_USE_POLICY_DEFINITIONS,
    PreToolUsePolicy,
    PreToolUsePolicyInfo
} from "@flex-builder/shared/hooks";
import type {
    PreToolUseHook,
} from "./hook";
import { AgentEventHandler } from "@flex-builder/shared/agent";
import { createAutoPreToolUseHook } from "./autoPreToolUseHook";

const preToolUseHooks = {
    allow: async () => ({
        decision: "allow",
    }),
    ask: async () => ({
        decision: "ask",
        reason: "Generated code requires user approval.",
    }),
    deny: async () => ({
        decision: "deny",
        reason: "Generated code execution is disabled by the selected policy.",
    }),
} satisfies Record<
    Exclude<
        PreToolUsePolicy,
        "auto"
    >,
    PreToolUseHook
>;

export function listPreToolUsePolicies():
    PreToolUsePolicyInfo[] {
    return PRE_TOOL_USE_POLICIES.map(
        (id) =>
            PRE_TOOL_USE_POLICY_DEFINITIONS[id],
    );
}

export function getPreToolUseHook(
    policy: PreToolUsePolicy,
    emit?: AgentEventHandler,
): PreToolUseHook {
    if (policy === "auto") {
        return createAutoPreToolUseHook(emit);
    }

    return preToolUseHooks[policy];
}