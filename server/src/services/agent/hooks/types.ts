import { PreToolUsePolicyInfo, SelectToolsPolicyInfo } from "@flex-builder/shared/hooks";
import type {
    PreToolUseHook,
} from "./preToolUse/hook";
import { SelectToolsHook } from "./selectTools/hook";

type HookRegistry = {
    preToolUse: {
        hook: PreToolUseHook;
        policy: PreToolUsePolicyInfo;
    },
    selectTools: {
        hook: SelectToolsHook;
        policy: SelectToolsPolicyInfo
    }
};

export type AgentHooks = Partial<HookRegistry>;