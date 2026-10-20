export const SELECT_TOOLS_HOOK =
    "selectTools" as const;

export const SELECT_TOOLS_POLICIES = [
    "all",
    "decision",
] as const;

export type SelectToolsPolicy =
    (typeof SELECT_TOOLS_POLICIES)[number];

export type SelectToolsPolicyInfo = {
    id: SelectToolsPolicy;
    label: string
    description: string;
};

export const SELECT_TOOLS_POLICY_DEFINITIONS = {
    all: {
        id: "all",
        label: "All Tools",
        description:
            "Make all available tools accessible to the model.",
    },

    decision: {
        id: "decision",
        label: "Decision Model",
        description:
            "Use a decision model to select relevant tools before each model call.",
    },
} satisfies Record<
    SelectToolsPolicy,
    SelectToolsPolicyInfo
>;

export type ToolSelection = {
    name: string;
    selected: boolean;
    probability?: number;
};