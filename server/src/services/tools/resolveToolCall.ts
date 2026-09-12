import { ResponseFunctionToolCallItem } from "openai/resources/responses/responses.js";
import { Tool, ToolRegistry } from "./types";

function getTool(
    tools: ToolRegistry,
    name: string,
): Tool {
    const tool =
        tools.find(
            (tool) =>
                tool.name === name,
        );

    if (!tool) {
        throw new Error(
            `Unknown tool "${name}"`,
        );
    }

    return tool;
}

export function resolveToolCall(
    call: ResponseFunctionToolCallItem,
    tools: ToolRegistry,
) {
    const tool =
        getTool(
            tools,
            call.name,
        );

    const args =
        tool.inputSchema.parse(
            JSON.parse(
                call.arguments ??
                    "{}",
            ),
        );

    return {
        tool,
        args,
    };
}