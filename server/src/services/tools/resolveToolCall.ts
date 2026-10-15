import { ResponseFunctionToolCallItem } from "openai/resources/responses/responses";
import { Tool, ToolRegistry } from "./types";

function getTool(
    tools: ToolRegistry,
    name: string,
): Tool {
    const tool = tools.find((tool) => tool.name === name);

    if (!tool) {
        throw new Error(`Unknown tool "${name}"`);
    }

    return tool;
}

export function resolveToolCall(
    call: ResponseFunctionToolCallItem,
    tools: Tool[],
) {
    const tool = tools.find(tool => tool.name === call.name);

    if (!tool) {
        throw new Error(
            `Unknown tool: ${call.name}`,
        );
    }

    const rawArgs = JSON.parse(call.arguments);

    const args = tool.inputSchema.parse(rawArgs);

    return {
        tool,
        args,
    };
}