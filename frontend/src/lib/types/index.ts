export type AgentEvent =
  | { type: "init"; message: string }
  | { type: "text_delta"; delta: string }
  | { type: "text_end"; responseId: string; fullText: string }
  | { type: "arguments_delta"; toolRound: number; delta: string; id: string }
  | { type: "tool_start"; toolRound: number; callId: string; name: string; args?: string, argsId: string }
  | { type: "tool_result"; toolRound: number; callId: string; name: string; outputPreview?: string }
  | { type: "done"; message: string }
  | { type: "error"; message: string };

export type MessageProps = {
  role: "user" | "assistant";
  content: string;
  status?: "in_progress" | "completed" | "incomplete";
};

export interface AgentState {
  name: string;
  model: string;
  prompt: string;
  skills: string[];
  messages: MessageProps[];
}

