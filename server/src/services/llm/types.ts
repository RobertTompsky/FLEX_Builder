import { AgentEvent, LlmEvent } from "@flex-builder/shared/agent";
import { Reasoning } from "openai/resources.js";
import { FunctionTool, ResponseInputItem } from "openai/resources/responses/responses.js";

export type LlmConfig = {
    model: string;
    messages: ResponseInputItem[];
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
    output: ResponseInputItem[];
};