import { FunctionTool } from "openai/resources/responses/responses.js";
import { CodeGenSchema } from "../../shared/schemas";
import { z } from 'zod'
import { buildExecutePrompt } from "../../../runtime/execute/prompt/buildExecutePrompt";
import { ResolvedCapability } from "../../../runtime/execute/types";

export function buildRunTsTool(capabilities: ResolvedCapability[]): FunctionTool {
    const sections = [
        `
        # Execute TypeScript code

        Execute TypeScript code in a sandboxed Bun process.
        `.trim(),

        `
        ## Execution strategy
        
        Complete as much of the task as possible within a single \`runTs\` call.
        
        - A single \`runTs\` call may invoke multiple actions.
        - Run independent actions in parallel.
        - Run dependent actions sequentially, passing outputs directly to subsequent actions.
        - Use standard JavaScript operations to transform, combine, filter, validate, serialize, and format data between actions.
        - Use documented output schemas when composing actions.
        - **Do not return after an intermediate action when the remaining steps can already be completed in the same code.**
        - Split the task across multiple \`runTs\` calls only when additional model reasoning, unavailable information, or user input is required.
        `.trim(),

        capabilities.length > 0
            ? buildExecutePrompt(capabilities)
            : "",

        `
        ## Rules
        - When needed, output final tool results using console.log(...).
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