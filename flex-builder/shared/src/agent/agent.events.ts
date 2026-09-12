export type LlmEvent =
  | {
    event: "text_delta";
    data: {
      delta: string;
    };
  }
  | {
    event: "text_end";
    data: {
      responseId: string;
      fullText: string;
    };
  }
  | {
    event: "arguments_delta";
    data: {
      id: string;
      delta: string;
    };
  }
  | {
    event: "output_item.added";
    data: {
      name: string;
      id: string;
      callId: string;
    };
  }
  | {
    event: "tool_call";
    data: {
      callId: string;
      name: string;
      args: string;
      argsId: string;
    };
  }
  | {
    event: "error";
    data: {
      message: string;
    };
  };

export type ToolExecutorEvent =
    | {
        event: "tool_start";
        data: {
            callId: string;
            name: string;
        };
    }
    | {
        event: "tool_result";
        data: {
            callId: string;
            name: string;
            outputPreview?: string;
        };
    };

export type AgentEvent =
  | { event: "init"; data: { runId: string, message: string } }
  | LlmEvent
  // | { event: "text_delta"; data: { delta: string } }
  // | { event: "text_end"; data: { responseId: string; fullText: string } }
  // | { event: "output_item.added"; data: { id: string; callId: string; name: string } }
  // | { event: "arguments_delta"; data: { delta: string; id: string } }
  // | { event: "tool_call"; data: { callId: string; name: string; args?: string; argsId: string } }
  | ToolExecutorEvent
  | { event: "end"; data: { message: string } }
  | { event: "pause"; data: { reason: string } }
  | { event: "stop"; data: { runId?: string; reason: string } }