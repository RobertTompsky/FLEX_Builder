import type {
    ResponseInputItem,
} from "openai/resources/responses/responses.js";

import type {
    AgentHooks,
} from "./hooks/types";

import type {
    ToolRegistry,
} from "../tools/types";

export type AgentConfig = {
    model: string;
    messages: ResponseInputItem[];
    tools: ToolRegistry;
    hooks?: AgentHooks;
    opts?: {
        maxTurns?: number;
        signal?: AbortSignal;
    };
};

export type AgentStatus =
    | "completed"
    | "awaiting_tool_approval"
    | "turn_limit";

export type AgentResult = {
    status: AgentStatus;
    output: ResponseInputItem[];
};