import { 
    PRE_TOOL_USE_POLICIES, 
    PRE_TOOL_USE_POLICY_DEFINITIONS, 
    PreToolUsePolicy, 
    PreToolUsePolicyInfo 
} from "@flex-builder/shared/hooks";
import type {
    PreToolUseHook,
} from "./hook";

const preToolUseHooks = {
    allow: async () => ({
        decision: "allow",
    }),

    ask: async () => ({
        decision: "ask",
        reason:
            "Generated code requires user approval.",
    }),

    deny: async () => ({
        decision: "deny",
        reason:
            "Generated code execution is disabled by the selected policy.",
    }),
} satisfies Record<
    PreToolUsePolicy,
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
): PreToolUseHook {
    return preToolUseHooks[policy];
}