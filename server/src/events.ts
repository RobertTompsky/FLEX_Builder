import { AgentEvent } from "./agents/events";
import { type AgentIdentity } from "./agents/shared/schemas";

export const RUNTIME_EVENT_PREFIX = "__RUNTIME_EVENT__:";

export type ArtifactRuntimeEvent =
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
            description?: string;
        };
    };

export type AgentStreamEvent = {
    agent: AgentIdentity;
    event: AgentEvent | ArtifactRuntimeEvent;
};

export type AgentRuntimeEvent = {
    event: "agent_event";
    data: AgentStreamEvent;
};

export type RuntimeEvent =
    | ArtifactRuntimeEvent
    | AgentRuntimeEvent;

export function emitRuntimeEvent(event: RuntimeEvent) {
    const line =
        `${RUNTIME_EVENT_PREFIX}${JSON.stringify(event)}\n`;

    //   console.error("[CHILD EMIT]", line);
    process.stdout.write(line);
}