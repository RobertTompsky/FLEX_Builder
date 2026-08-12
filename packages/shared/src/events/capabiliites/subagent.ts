import { AgentStreamEvent } from "..";

export type SubagentEvent = {
    event: "subagent_event";
    data: {
        parentRunId: string;
        parentToolCallId: string;
        subagentRunId: string;
        event: AgentStreamEvent;
    };
};