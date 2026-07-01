import z from "zod";
import { loadSkills } from "./loadSkills";

export const listActions = async (baseDir: string, allowedSkills: string[]) => {
    const loadedSkills = await loadSkills(
        baseDir,
        allowedSkills,
    );

    const skillsManifest = loadedSkills.map((skill) => ({
        id: skill.id,
        description: skill.description,
        actions: Object.entries(skill.actions).map(
            ([actionName, action]) => ({
                name: `${skill.id}.${actionName}`,
                description: action.description,
                inputSchema: z.toJSONSchema(action.inputSchema),
            }),
        ),
    }));

    const executeInstructions = skillsManifest.length
        ? `
        Available skills and runtime actions:
              
        ${skillsManifest.map((skill) => `
            Skill: ${skill.id}
            Description: ${skill.description}
              
            Actions:
            ${skill.actions.map((action) => `
            - ${action.name}
            Description: ${action.description}
            Input schema:
            ${JSON.stringify(action.inputSchema, null, 2)}`.trim()).join("\n")}
            `.trim())
            .join("\n\n")}
    
            Use an action through the global execute function:
            
            const result = await execute({
              action: "skill_id.action_name",
              args: {
                // arguments matching the action input schema
              },
            });
            
            Rules:
            - Do NOT import files from skills.
            - Do NOT read skill source files to discover their API.
            - Use only actions listed above.
            - execute(...) validates args against the action input schema.
            `
        : "";

    return executeInstructions
}