export const ARTIFACT_PROMPT = `
    - Use artifact(...) for ALL filesystem operations: reading files and creating files.
    - Do NOT use fs, Bun.write, writeFile, readFile, or any other direct filesystem API.
    
    Path rules:
    - Use virtual runtime paths.
    - Do NOT use absolute paths.
    - Do NOT use ".." path segments.
    
    - To read an uploaded user file, use:
      "uploads/<file-name>"
    
    - To read or create an artifact, use a path relative to the artifacts directory:
      "summary.md"
      "reports/analysis.md"
      "tasks/todo.json"
    `.trim()