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

## Action composition

Compose multiple actions within the same program whenever possible.

- Run independent actions in parallel.
- Run dependent actions sequentially, passing outputs directly to subsequent actions.
- Use standard JavaScript operations to transform, combine, filter, validate, and format data between action calls.
- Use the documented output schemas to compose actions safely.

Example of two dependent actions:

\`\`\`ts
const data = await execute({
    action: "source.fetch",
    args: {
        query: "example",
    },
});

await execute({
    action: "artifact.create",
    args: {
        filePath: "result.json",
        content: JSON.stringify(
            data,
            null,
            2,
        ),
        description:
            "Fetched and formatted data.",
        report:
            "Saving the fetched data as a JSON artifact.",
    },
});
\`\`\`

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