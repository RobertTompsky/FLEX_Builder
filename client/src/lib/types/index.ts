export type AgentEvent =
  | { event: "init"; data: { message: string } }
  | { event: "text_delta"; data: { delta: string } }
  | { event: "text_end"; data: { responseId: string; fullText: string } }
  | { event: "output_item.added"; data: { toolRound: number; id: string; callId: string; name: string } }
  | { event: "arguments_delta"; data: { toolRound: number; delta: string; id: string } }
  | { event: "tool_start"; data: { toolRound: number; callId: string; name: string; args?: string; argsId: string } }
  | { event: "tool_result"; data: { toolRound: number; callId: string; name: string; outputPreview?: string } }
  | { event: "end"; data: { message: string } }
  | { event: "pause"; data: { reason: string } }
  | { event: "stop"; data: { runId?: string; reason: string } }
  | { event: "error"; data: { message: string } };
  
export type UploadEvent =
  | { event: 'upload_start', data: { name: string } }
  | { event: 'upload_done', data: { filename: string, type: string, path: string } }

export type UIMessage = {
  role: "user" | "assistant";
  content: string;
  status?: "in_progress" | "completed" | "incomplete";
};

export interface AgentState {
  name: string;
  model: string;
  prompt: string;
  toolRounds: number,
  skills: string[];
  messages: UIMessage[];
  pause?: boolean
  runId: string | null
}