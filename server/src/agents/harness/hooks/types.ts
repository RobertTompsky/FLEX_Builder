import type {
    PreToolUseHook,
} from "./preToolUse/hook";

import type {
    PreToolUsePolicyInfo,
} from "./preToolUse/policy";

type HookRegistry = {
    preToolUse: {
        hook: PreToolUseHook;
        policy: PreToolUsePolicyInfo;
    };
};

export type AgentHooks = Partial<{
    [HookName in keyof HookRegistry]:
        HookRegistry[HookName]["hook"];
}>;

export type HookPoliciesInfo = {
    [HookName in keyof HookRegistry]:
        HookRegistry[HookName]["policy"][];
};