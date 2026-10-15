import type {
    ResponseInputItem,
} from "openai/resources/responses/responses.js";

import type {
    SelectToolsHook,
} from "./hook";

import {
    createSelectToolsContext,
} from "./hook";

import type {
    Tool,
} from "../../../tools/types";

export async function selectModelTools(
    hook: SelectToolsHook | undefined,
    messages: ResponseInputItem[],
    tools: Tool[],
): Promise<Tool[]> {
    if (!hook || tools.length === 0) {
        return tools;
    }

    const selectedNames = await hook(
        createSelectToolsContext(messages, tools),
    );

    console.log("[SELECT TOOLS] Selected", selectedNames);

    const selected = new Set(selectedNames);

    return tools.filter(
        tool => selected.has(tool.name),
    );
}