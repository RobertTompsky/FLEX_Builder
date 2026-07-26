import { FunctionTool } from "openai/resources/responses/responses.js";
import { RuntimeGlobal } from "../../../runtime/globals/types";
import { CodeGenSchema } from "../../shared/schemas";
import { z } from 'zod'
import { buildGlobalsPrompt } from "../../../runtime/globals/prompt";

export async function buildRunTsTool(
    globals: RuntimeGlobal[],
): Promise<FunctionTool> {
    const names = globals.map((global) => global.name);

    const duplicateNames = names.filter(
        (name, index) =>
            names.indexOf(name) !== index,
    );

    if (duplicateNames.length > 0) {
        throw new Error(
            `Duplicate runtime globals: ${[...new Set(duplicateNames)].join(", ")
            }`,
        );
    }

    const runtimeGlobalsPrompt = await buildGlobalsPrompt(globals);

    const runTsTool: FunctionTool = {
        type: "function",
        name: "runTs",
        strict: true,

        description: `
        # Execute TypeScript code in a sandboxed Bun process.
        
        ## Runtime globals:
        ${runtimeGlobalsPrompt}
        
        ## Rules:
        - Output final tool results using console.log(...).
        - Write pure TypeScript.
        `.trim(),

        parameters: z.toJSONSchema(CodeGenSchema),
    };

    return runTsTool;
}