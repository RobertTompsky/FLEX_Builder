import type {
    FunctionTool,
} from "openai/resources/responses/responses.js";

import {
    z,
} from "zod";

import type {
    Tool,
} from "./types";

export function buildModelTools(
    tools: Tool[],
): FunctionTool[] {
    return tools.map(
        (tool) => ({
            type: "function",
            name: tool.name,
            strict: true,
            description: tool.description,
            parameters: z.toJSONSchema(tool.inputSchema,),
        }),
    );
}