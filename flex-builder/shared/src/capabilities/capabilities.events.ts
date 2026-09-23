import type { AgentEvent } from "../agent/agent.events";

export type ArtifactEvent =
    | {
        event: "artifact_read";
        data: {
            filePath: string;
            report: string;
        };
    }
    | {
        event: "artifact_created";
        data: {
            filePath: string;
            report: string;
            description: string;
        };
    };

export type SubagentEvent = {
    event: "subagent_event";
    data: {
        subagentRunId: string;
        event: AgentEvent;
    };
};

export type CapabilityEvent =
    | ArtifactEvent
    | SubagentEvent