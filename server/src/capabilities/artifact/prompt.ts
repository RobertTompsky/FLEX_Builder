export const ARTIFACT_PROMPT = `
- Use artifact(...) for all artifact filesystem operations.
- Do not use fs, Bun.write, writeFile, readFile, or other direct filesystem APIs.

Path rules:
- Paths are relative to the current agent's artifact workspace.
- Do not use absolute paths.
- Do not use ".." path segments.

Examples:
- "summary.md"
- "reports/analysis.md"
- "tasks/todo.json"
`.trim();