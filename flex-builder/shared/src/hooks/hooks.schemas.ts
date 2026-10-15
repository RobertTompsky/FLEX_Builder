import { z } from "zod";

import {
    PRE_TOOL_USE_HOOK,
    PRE_TOOL_USE_POLICIES,
} from "./pre-tool-use";

import {
    SELECT_TOOLS_HOOK,
    SELECT_TOOLS_POLICIES,
} from "./select-tools";

export const HookPolicySelectionSchema =
    z.object({
        [PRE_TOOL_USE_HOOK]: z.enum(
            PRE_TOOL_USE_POLICIES,
        ),

        [SELECT_TOOLS_HOOK]: z.enum(
            SELECT_TOOLS_POLICIES,
        ).default("all"),
    });

export type HookPolicySelection =
    z.infer<typeof HookPolicySelectionSchema>;