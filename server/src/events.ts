import type { AgentIdentity } from "./llm/types";

export const RUNTIME_EVENT_PREFIX = "__RUNTIME_EVENT__:";

export type AgentEvent =
  | { event: "init"; data: { message: string } }
  | { event: "text_delta"; data: { delta: string } }
  | { event: "text_end"; data: { responseId: string; fullText: string } }
  | { event: "output_item.added"; data: { id: string; callId: string; name: string } }
  | { event: "arguments_delta"; data: { delta: string; id: string } }
  | { event: "tool_start"; data: { callId: string; name: string; args?: string; argsId: string } }
  | { event: "tool_result"; data: { callId: string; name: string; outputPreview?: string } }
  | { event: "end"; data: { message: string } }
  | { event: "pause"; data: { reason: string } }
  | { event: "stop"; data: { runId?: string; reason: string } }
  | { event: "error"; data: { message: string } };

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