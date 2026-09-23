import z from "zod";
import { executeInputSchema, executeOutputSchema } from "../../execute/schemas";
import {
    buildCapabilitiesPrompt,
    CapabilityPromptInput
} from "./capabilityPrompt";

function section(title: string, content: string[]): string {
    return [
        `## ${title}`,
        "",
        ...content,
    ].join("\n");
}

function codeBlock(language: string, content: string): string {
    return [
        `\`\`\`${language}`,
        content,
        "```",
    ].join("\n");
}

function schemaBlock(schema: z.ZodType): string {
    return codeBlock(
        "json",
        JSON.stringify(
            z.toJSONSchema(schema),
            null,
            2,
        ),
    );
}

const EXAMPLE = `
const data = await execute({
    capability: "news",
    action: "fetch",
    args: {
        query: "example",
    },
});

await execute({
    capability: "artifact",
    action: "create",
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
`.trim();

function buildExecutePromptBase(): string {
    return [
        "A global async function named `execute` is available inside the sandbox.",
        "",
        "Signature:",
        "",
        "`execute(input: ExecuteInput): Promise<ExecuteOutput>`",
        "",
        "Pass exactly one object argument to `execute`.",
        "Do not pass the action name and arguments as separate parameters.",
        "",
        "Input schema:",
        schemaBlock(executeInputSchema),
        "",
        "Successful output schema:",
        schemaBlock(executeOutputSchema),
        "",
        section(
            "Action composition",
            [
                "Compose multiple actions within the same program whenever possible.",
                "",
                "- Run independent actions in parallel.",
                "- Run dependent actions sequentially, passing outputs directly to subsequent actions.",
                "- Use standard JavaScript operations to transform, combine, filter, validate, and format data between action calls.",
                "- Use the documented output schemas to compose actions safely.",
                "",
                "Example of two dependent actions:",
                "",
                codeBlock(
                    "ts",
                    EXAMPLE,
                ),
            ],
        ),
        "",
        "Use only the actions documented below.",
        "Do not import or inspect their implementation files.",
    ].join("\n");
}

export function buildExecutePrompt(
    capabilities: CapabilityPromptInput[],
): string {
    const capabilitiesPrompt = buildCapabilitiesPrompt(capabilities);

    return [
        buildExecutePromptBase(),
        capabilitiesPrompt,
    ]
        .filter(Boolean)
        .join("\n\n");
}