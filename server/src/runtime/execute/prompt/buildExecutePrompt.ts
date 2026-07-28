import z from "zod";
import { executeInputSchema, executeOutputSchema } from "../schemas";
import type {
    ResolvedCapability,
} from "../types";

import {
    buildCapabilitiesPrompt,
} from "./capabilityPrompt";

const EXECUTE_PROMPT = `
A global async function named \`execute\` is available inside the sandbox.

Signature:
\`execute(input: ExecuteInput): Promise<ExecuteOutput>\`

Pass exactly one object argument to execute.
Do not pass the action name and arguments as separate parameters.

Input schema:
${JSON.stringify(
    z.toJSONSchema(
        executeInputSchema,
    ),
    null,
    2,
)}

Successful output schema:
${JSON.stringify(
    z.toJSONSchema(
        executeOutputSchema,
    ),
    null,
    2,
)}

Use only the actions documented below.
Do not import or inspect their implementation files.
`.trim();

export function buildExecutePrompt(
    capabilities:
        ResolvedCapability[],
): string {
    const capabilitiesPrompt =
        buildCapabilitiesPrompt(
            capabilities,
        );

    return [
        EXECUTE_PROMPT,
        capabilitiesPrompt,
    ]
        .filter(Boolean)
        .join("\n\n");
}