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
                outputSchema: z.toJSONSchema(action.outputSchema)
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
            ${JSON.stringify(action.inputSchema, null, 2)}
            
            Successful output schema:
            ${JSON.stringify(action.outputSchema, null, 2)}
            `.trim(),).join("\n\n")}
            `.trim(),
        ).join("\n\n")}
            
        Rules:
        - Do NOT import files from skills.
        - Do NOT read skill source files to discover their API.
        - Use only actions listed above.
        - execute(...) validates args against the action input schema.
        `
        : "";

    return executeInstructions
}