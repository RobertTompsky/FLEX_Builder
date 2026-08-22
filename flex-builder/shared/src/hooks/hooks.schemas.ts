import { z } from "zod";

import {
    PRE_TOOL_USE_HOOK,
    PRE_TOOL_USE_POLICIES,
} from "./pre-tool-use";

export const HookPolicySelectionSchema =
    z.object({
        [PRE_TOOL_USE_HOOK]: z.enum(
            PRE_TOOL_USE_POLICIES,
        ),
    });

export type HookPolicySelection =
    z.infer<
        typeof HookPolicySelectionSchema
    >;

