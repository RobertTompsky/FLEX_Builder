import type {
    ExecuteInput,
    LoadedSkill,
    RuntimeAction,
    RuntimeExecute,
} from "./types";

export function createExecute(
    skills: LoadedSkill[],
): RuntimeExecute {
    const registry = new Map<string, RuntimeAction>();

    for (const skill of skills) {
        for (const [actionName, action] of Object.entries(
            skill.actions,
        )) {
            const qualifiedName = `${skill.id}.${actionName}`;

            if (registry.has(qualifiedName)) {
                throw new Error(
                    `Duplicate runtime action: ${qualifiedName}`,
                );
            }

            registry.set(qualifiedName, action);
        }
    }

    return async function execute({
        action,
        args,
    }: ExecuteInput): Promise<unknown> {
        const definition = registry.get(action);

        if (!definition) {
            const available = [...registry.keys()].join(", ");

            throw new Error(
                `Unknown action "${action}". Available actions: ${available}`,
            );
        }

        return definition.execute(args);
    };
}