import type {
    AgentHooks,
} from "./types";

import {
    PRE_TOOL_USE_POLICY_DEFINITIONS,
    SELECT_TOOLS_POLICY_DEFINITIONS,
    type HookPolicySelection,
} from "@flex-builder/shared/hooks";

import {
    getPreToolUseHook,
} from "./preToolUse/policy";

import {
    getSelectToolsHook,
} from "./selectTools/policy";

export function createHooks(
    policies: HookPolicySelection
): AgentHooks {
    return {
        preToolUse: {
            hook: getPreToolUseHook(policies.preToolUse),
            policy: PRE_TOOL_USE_POLICY_DEFINITIONS[policies.preToolUse],
        },

        selectTools: {
            hook: getSelectToolsHook(policies.selectTools),
            policy: SELECT_TOOLS_POLICY_DEFINITIONS[policies.selectTools],
        },
    };
}