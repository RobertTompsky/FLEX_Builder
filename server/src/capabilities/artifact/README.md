# Artifact capability

Use the artifact capability for all filesystem operations involving agent artifacts.

Do not use `fs`, `Bun.write`, `writeFile`, `readFile`, or any other direct filesystem APIs.

## Path rules

* Paths point to files inside the current agent's artifact workspace.
* Always include the file extension.
* Do not use absolute paths.
* Do not use `..` path segments.

## Path examples

* `summary.md`
* `reports/analysis.md`
* `tasks/todo.json`
