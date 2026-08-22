import { AgentEvent } from "../agent/agent.events";
import { AgentSourceEvent, ToAgentSSEMessage } from "../agent/agent.sse";
import { AgentIdentity } from "../agent/agent.types";

export type ArtifactEvent =
    | {
        event: "artifact_read";
        data: {
            runId: string;
            toolCallId: string;
            filePath: string;
            report: string;
        };
    }
    | {
        event: "artifact_created";
        data: {
            runId: string;
            toolCallId: string;
            filePath: string;
            report: string;
            description?: string;
        };
    };

export type SubagentEvent = {
    event: "subagent_event";
    data: {
        parentRunId: string;
        parentToolCallId: string;
        subagentRunId: string;
        subevent: ToAgentSSEMessage<AgentEvent>;
    };
}

export type CapabilityEvent =
    | ArtifactEvent
    | SubagentEvent