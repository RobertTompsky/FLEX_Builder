import { FunctionTool } from "openai/resources/responses/responses.js";
import { CodeGenSchema } from "../../shared/schemas";
import { z } from 'zod'
import { buildExecutePrompt } from "../../../runtime/execute/prompt/buildExecutePrompt";
import { ResolvedCapability } from "../../../runtime/execute/types";

export function buildRunTsTool(
    capabilities: ResolvedCapability[],
): FunctionTool {
    const sections = [
        "# Execute TypeScript code in a sandboxed Bun process.",
        capabilities.length > 0
            ? buildExecutePrompt(capabilities)
            : "",

        `
        ## Rules
        - Output final tool results using console.log(...).
        - Write pure TypeScript.
        `.trim(),
    ];

    // console.log(executePrompt)

    return {
        type: "function",
        name: "runTs",
        strict: true,
        description: sections
            .filter(Boolean)
            .join("\n\n"),
        parameters: z.toJSONSchema(CodeGenSchema),
    };
}