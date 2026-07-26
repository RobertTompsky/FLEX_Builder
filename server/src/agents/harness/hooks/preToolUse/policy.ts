import type {
    PreToolUseHook,
} from "./hook";

export const PRE_TOOL_USE_POLICIES = [
    "allow",
    "ask",
    "deny",
] as const;

export type PreToolUsePolicy =
    typeof PRE_TOOL_USE_POLICIES[number];

export type PreToolUsePolicyInfo = {
    id: PreToolUsePolicy;
    label: string;
    description: string;
};

type PreToolUsePolicyDefinition =
    PreToolUsePolicyInfo & {
        hook: PreToolUseHook;
    };

const preToolUsePolicyRegistry = {
    allow: {
        id: "allow",
        label: "Always allow",
        description:
            "Execute generated code without user confirmation.",

        hook: async () => ({
            decision: "allow",
        }),
    },

    ask: {
        id: "ask",
        label: "Ask before execution",
        description:
            "Require user confirmation before executing generated code.",

        hook: async () => ({
            decision: "ask",
            reason:
                "Generated code requires user approval.",
        }),
    },

    deny: {
        id: "deny",
        label: "Always deny",
        description:
            "Prevent generated code from being executed.",

        hook: async () => ({
            decision: "deny",
            reason:
                "Generated code execution is disabled by the selected policy.",
        }),
    },
} satisfies Record<
    PreToolUsePolicy,
    PreToolUsePolicyDefinition
>;

export function listPreToolUsePolicies():
    PreToolUsePolicyInfo[] {
    return PRE_TOOL_USE_POLICIES.map(
        (id) => {
            const {
                hook: _hook,
                ...info
            } = preToolUsePolicyRegistry[id];

            return info;
        },
    );
}

export function getPreToolUseHook(
    policy: PreToolUsePolicy,
): PreToolUseHook {
    return preToolUsePolicyRegistry[
        policy
    ].hook;
}