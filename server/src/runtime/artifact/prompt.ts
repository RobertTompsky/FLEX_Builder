export const ARTIFACT_PROMPT = `
    artifact(input) is available globally. Do NOT import it.
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
    
    artifact(...) examples:
    
    Read a skill source file:
    artifact({
      type: "read",
      filePath: "skills/example/index.ts",
      report: "Read skill source to understand its input schema"
    })
    
    Read an uploaded file:
    artifact({
      type: "read",
      filePath: "uploads/README.md",
      report: "Read uploaded README file"
    })
    
    Create an artifact:
    artifact({
      type: "create",
      filePath: "summary.md",
      content: "# Summary\\n...",
      description: "Summary generated from uploaded files",
      report: "Created summary artifact"
    })
    `.trim()