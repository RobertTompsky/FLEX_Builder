import {
    executeInputSchema,
    executeOutputSchema,
} from "./schemas";

import type {
    RuntimeContext,
} from "../types";

import type {
    CapabilityDefinition,
    RuntimeAction,
    RuntimeExecute,
} from "./types";

function createActionRegistry(
    capabilities:
        CapabilityDefinition[],
): Map<
    string,
    RuntimeAction
> {
    const registry = new Map<string, RuntimeAction>();

    for (const capability of capabilities) {
        for (
            const [actionName, action] of Object.entries(capability.actions)
        ) {
            const qualifiedName =
                `${capability.id}.${actionName}`;

            if (registry.has(qualifiedName,)
            ) {
                throw new Error(
                    `Duplicate runtime action "${qualifiedName}"`,
                );
            }

            registry.set(qualifiedName, action,);
        }
    }

    return registry;
}

export function createExecute(
    capabilities: CapabilityDefinition[],
    context: RuntimeContext,
): RuntimeExecute {
    const registry =
        createActionRegistry(
            capabilities,
        );

    return async function execute(rawInput,) {
        const { action, args, } = executeInputSchema.parse(rawInput,);

        const definition = registry.get(action,);

        if (!definition) {
            const available =
                [...registry.keys()]
                    .join(", ");

            throw new Error(
                available
                    ? `Unknown action "${action}". Available actions: ${available}`
                    : `Unknown action "${action}". No runtime actions are available.`,
            );
        }

        const result = await definition.execute(
            args,
            context,
        );

        return executeOutputSchema.parse(result,);
    };
}