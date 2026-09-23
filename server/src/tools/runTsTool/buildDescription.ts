import { buildExecutePrompt } from "../../services/capabilities/prompt/buildExecutePrompt";
import { CapabilityPromptInput } from "../../services/capabilities/prompt/capabilityPrompt";

const RUN_TS_INTRO = `
# Execute TypeScript code

Execute TypeScript code in a sandboxed Bun process.
`.trim();

const RUN_TS_RULES = `
## Rules

- When needed, output final tool results using console.log(...).
- Write pure TypeScript.
`.trim();

export function buildRunTsDescription(
    capabilities: CapabilityPromptInput[]
): string {
    return [
        RUN_TS_INTRO,
        ...(capabilities.length
            ? [buildExecutePrompt(capabilities)]
            : []),
        RUN_TS_RULES,
    ].join("\n\n");
}