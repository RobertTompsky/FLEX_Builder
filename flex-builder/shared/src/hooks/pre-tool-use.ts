export const PRE_TOOL_USE_HOOK =
    "preToolUse" as const;

export const PRE_TOOL_USE_POLICIES = [
    "allow",
    "ask",
    "deny",
    "auto",
] as const;

export type PreToolUsePolicy = typeof PRE_TOOL_USE_POLICIES[number];

export type PreToolUseDecision = Exclude<PreToolUsePolicy, "auto">;

export type PreToolUsePolicyInfo = {
    id: PreToolUsePolicy;
    label: string;
    description: string;
};

export const PRE_TOOL_USE_POLICY_DEFINITIONS = {
    allow: {
        id: "allow",
        label: "Always allow",
        description:
            "Execute generated code without user confirmation.",
    },

    ask: {
        id: "ask",
        label: "Ask before execution",
        description:
            "Require user confirmation before executing generated code.",
    },

    deny: {
        id: "deny",
        label: "Always deny",
        description:
            "Prevent generated code from being executed.",
    },

    auto: {
        id: "auto",
        label: "Automatic",
        description:
            "Use an AI decision model to determine whether generated code can run automatically, requires user approval, or should be denied.",
    },
} satisfies Record<
    PreToolUsePolicy,
    PreToolUsePolicyInfo
>;