import type { PreToolUseDecision, PreToolUsePolicy, PreToolUseResult } from "./pre-tool-use";
import { SelectToolsPolicy, ToolSelection } from "./select-tools";

export type PreToolUseEvent = {
    event: "pre_tool_use";

    data: PreToolUseResult & {
        callIds: string[];
        policy: PreToolUsePolicy;
    };
};

export type SelectToolsEvent = {
    event: "tool_selection";

    data: {
        policy: SelectToolsPolicy;
        model?: "gpt-6-luna";
        tools: ToolSelection[];
    };
};