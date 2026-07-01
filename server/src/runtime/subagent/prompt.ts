import { getSkillsRegistry } from "../../lib/utils/getSkillsRegistry";

export function buildSubagentPrompt(
    baseDir: string,
    allowedSkills: string[],
): string {
    const allowedSet = new Set(allowedSkills);

    const skills = getSkillsRegistry(baseDir)
        .filter((skill) => allowedSet.has(skill.name));

    const skillsList = skills.length > 0
        ? skills
            .map(
                (skill) => `
                - ${skill.name}
                  ${skill.description ?? "No description provided."}
                `.trim(),
            )
            .join("\n")
        : "- No skills are available.";

    return `
    Delegates a focused task to a separate subagent.
    
    The subagent has access to:
    - artifact
    - execute
    - only the skills you explicitly provide
    
    Available skills:
    ${skillsList}
    
    Use subagent when a task can be delegated to a focused worker.
    Pass a clear, self-contained query and only the skills required for that task.
    
    Example:
    const result = await subagent({
      query: "Find the current Bitcoin price and calculate the value of 0.25 BTC.",
      skills: ["crypto"],
    });
    
    console.log(result);
    `.trim();
}