import { HookPolicySelection } from "./hooks.schemas";
import {
    PRE_TOOL_USE_HOOK,
    type PreToolUsePolicyInfo,
} from "./pre-tool-use";

export type HookPolicyInfoRegistry = {
    [PRE_TOOL_USE_HOOK]: PreToolUsePolicyInfo;
};

export type HookPoliciesInfo = {
    [K in keyof HookPolicySelection]:
    HookPolicyInfoRegistry[K][];
};