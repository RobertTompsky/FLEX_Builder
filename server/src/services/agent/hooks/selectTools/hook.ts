import type {
    ResponseInputItem,
} from "openai/resources/responses/responses.js";

import type {
    Tool,
} from "../../../tools/types";
import { ToolSelection } from "@flex-builder/shared/hooks";

export type SelectToolsContext = {
    messages: ResponseInputItem[];
    tools: {
        name: string;
        description: string;
    }[];
};

export type SelectToolsHook = (
    context: SelectToolsContext,
) => Promise<ToolSelection[]>;

export function createSelectToolsContext(
    messages: ResponseInputItem[],
    tools: Tool[],
): SelectToolsContext {
    return {
        messages,
        tools:
            tools.map(
                tool => ({
                    name: tool.name,
                    description: tool.description,
                }),
            ),
    };
}