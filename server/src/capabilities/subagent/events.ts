import { AgentEnvelopeEvent } from "../../agents/events";

export type SubagentEvent = {
    event: "subagent_event";
    data: {
        parentRunId: string;
        parentToolCallId: string;
        // subagentCallId: string;
        subagentRunId: string;
        event: AgentEnvelopeEvent;
    };
};

