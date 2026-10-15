import { HookPolicySelection } from "./hooks.schemas";
import {
    PRE_TOOL_USE_HOOK,
    PreToolUsePolicy,
    type PreToolUsePolicyInfo,
} from "./pre-tool-use";
import { SELECT_TOOLS_HOOK, SelectToolsPolicyInfo } from "./select-tools";

export type HookPolicyInfoRegistry = {
    [PRE_TOOL_USE_HOOK]: PreToolUsePolicyInfo;
    [SELECT_TOOLS_HOOK]: SelectToolsPolicyInfo;
};

export type HookPoliciesInfo = {
    [K in keyof HookPolicySelection]:
    HookPolicyInfoRegistry[K][];
};