import { AgentEvent, LlmEvent } from "@flex-builder/shared/agent";
import { Reasoning } from "openai/resources";
import { FunctionTool, ResponseInput } from "openai/resources/responses/responses";

export type LlmConfig = {
    model: string;
    messages: ResponseInput;
    tools: FunctionTool[];
    reasoning?: Reasoning;
    signal?: AbortSignal;

    onEvent?: (
        event: LlmEvent,
    ) => void | Promise<void>;
};

export type LlmStepResult = {
    status: | "completed" | "tool_calls";
    responseId: string;
    output: ResponseInput;
};