import type {
    HookPolicySelection,
} from "./schemas";

import type {
    AgentHooks,
} from "./types";

import {
    getPreToolUseHook,
} from "./preToolUse/policy";

export function createHooks(
    policies: HookPolicySelection,
): AgentHooks {
    return {
        preToolUse:
            getPreToolUseHook(
                policies.preToolUse,
            ),
    };
}