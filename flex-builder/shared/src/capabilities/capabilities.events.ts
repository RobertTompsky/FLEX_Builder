import type { AgentEvent } from "../agent/agent.events";

export type ExecutionSource = {
    runId: string;
    toolCallId: string;
};

export type ArtifactEvent =
    | {
        event: "artifact_read";
        data: ExecutionSource & {
            filePath: string;
            report: string;
        };
    }
    | {
        event: "artifact_created";
        data: ExecutionSource & {
            filePath: string;
            report: string;
            description: string;
        };
    };

export type SubagentEvent = {
    event: "subagent_event";
    data: {
        parent: ExecutionSource;
        subagent: Pick<ExecutionSource, "runId">;
        event: AgentEvent;
    };
};

export type CapabilityEvent =
    | ArtifactEvent
    | SubagentEvent