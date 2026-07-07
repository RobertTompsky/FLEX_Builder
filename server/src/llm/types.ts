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

export type Emit<E> = (ev: E) => void | Promise<void>