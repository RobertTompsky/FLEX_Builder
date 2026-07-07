import type { AgentEvent } from "../llm/types";

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

export type SubagentRuntimeEvent = {
    event: "subagent_event";
    data: {
        subagentId: string;
        event: AgentEvent | ArtifactRuntimeEvent;
    };
};

export type RuntimeEvent =
    | ArtifactRuntimeEvent
    | SubagentRuntimeEvent;

export function emitRuntimeEvent(event: RuntimeEvent) {
    const line =
        `${RUNTIME_EVENT_PREFIX}${JSON.stringify(event)}\n`;

    //   console.error("[CHILD EMIT]", line);
    process.stdout.write(line);
}