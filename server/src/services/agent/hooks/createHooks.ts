import type {
    AgentHooks,
} from "./types";

import type {
    HookPolicySelection,
} from "@flex-builder/shared/hooks";

import type {
    AgentEventHandler,
} from "@flex-builder/shared/agent";

import {
    getPreToolUseHook,
} from "./preToolUse/policy";

import {
    getSelectToolsHook,
} from "./selectTools/policy";

export function createHooks(
    policies: HookPolicySelection,
    emit?: AgentEventHandler,
): AgentHooks {
    return {
        preToolUse: getPreToolUseHook(
            policies.preToolUse,
            emit,
        ),

        selectTools: getSelectToolsHook(
            policies.selectTools,
            emit,
        ),
    };
}