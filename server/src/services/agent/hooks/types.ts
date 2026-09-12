import { PreToolUsePolicyInfo } from "@flex-builder/shared/hooks";
import type {
    PreToolUseHook,
} from "./preToolUse/hook";

type HookRegistry = {
    preToolUse: {
        hook: PreToolUseHook;
        policy: PreToolUsePolicyInfo;
    };
};

export type AgentHooks = Partial<{
    [HookName in keyof HookRegistry]:
        HookRegistry[HookName]["hook"];
}>;