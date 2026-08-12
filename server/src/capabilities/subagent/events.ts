import { AgentEvent } from "../../agents/events";
import { AgentIdentity } from "../../agents/shared/schemas";

export type SubagentEvent = {
    event: "subagent_event";
    data: {
        parentRunId: string;
        parentToolCallId: string;
        // subagentCallId: string;
        subagentRunId: string;
        subagent: AgentIdentity;
        event: AgentEvent;
    };
};

