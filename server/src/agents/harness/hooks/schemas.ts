import { z } from "zod";

import {
    PRE_TOOL_USE_POLICIES,
} from "./preToolUse/policy";

export const HookPolicySelectionSchema =
    z.object({
        preToolUse: z.enum(
            PRE_TOOL_USE_POLICIES,
        ),
    });

export type HookPolicySelection = z.infer<typeof HookPolicySelectionSchema>;