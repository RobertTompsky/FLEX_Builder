import { PreToolUseDecision } from "./pre-tool-use";

export type PreToolUseEvent = {
  event: "pre_tool_use";
  data: {
    model: "gpt-6-luna";
    decision: PreToolUseDecision;
    confidence: number;
    probabilities: Record<PreToolUseDecision, number>;
  };
};

export type SelectToolsEvent = {
  event: "tool_selection";
  data: {
    model: "gpt-6-luna";
    tools: {
      name: string;
      probability: number;
      selected: boolean;
    }[];
  };
};