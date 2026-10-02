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
    event: "llm_error";
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
  }
  | {
    event: "tool_error";
    data: {
      callId: string;
      name: string;
      message: string;
    };
  }

export type AgentEvent =
  | LlmEvent
  | ToolExecutorEvent