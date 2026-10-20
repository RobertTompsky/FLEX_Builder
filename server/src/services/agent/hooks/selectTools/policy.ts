
import type {
    AgentEventHandler,
} from "@flex-builder/shared/agent";

import type {
    SelectToolsHook,
} from "./hook";

import {
    SELECT_TOOLS_POLICIES,
    SELECT_TOOLS_POLICY_DEFINITIONS,
    SelectToolsPolicy,
    SelectToolsPolicyInfo
} from "@flex-builder/shared/hooks";
import { createSelectToolsHook } from "./selectToolsHook";

const selectToolsHooks = {
    all: async ({ tools }) => tools.map(tool => tool.name)
} satisfies Record<
    Exclude<SelectToolsPolicy, "decision">,
    SelectToolsHook
>;

export function listSelectToolsPolicies():
    SelectToolsPolicyInfo[] {
    return SELECT_TOOLS_POLICIES.map(
        id => SELECT_TOOLS_POLICY_DEFINITIONS[id],
    );
}

export function getSelectToolsHook(
    policy: SelectToolsPolicy
): SelectToolsHook {
    if (policy === "decision") {
        return createSelectToolsHook();
    }

    return selectToolsHooks[policy];
}