import type {
    AgentHooks,
} from "./types";

import {
    getPreToolUseHook,
} from "./preToolUse/policy";
import { HookPolicySelection } from "@flex-builder/shared/hooks";

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