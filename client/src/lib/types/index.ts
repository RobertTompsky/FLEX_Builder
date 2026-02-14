export type AgentEvent =
  | { type: "init"; data: { message: string } }
  | { type: "text_delta"; data: { delta: string } }
  | { type: "text_end"; data: { responseId: string; fullText: string } }
  | { type: "output_item.added"; data: { toolRound: number; id: string; callId: string; name: string } }
  | { type: "arguments_delta"; data: { toolRound: number; delta: string; id: string } }
  | { type: "tool_start"; data: { toolRound: number; callId: string; name: string; args?: string; argsId: string } }
  | { type: "tool_result"; data: { toolRound: number; callId: string; name: string; outputPreview?: string } }
  | { type: "done"; data: { message: string } }
  | { type: "error"; data: { message: string } };

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
}