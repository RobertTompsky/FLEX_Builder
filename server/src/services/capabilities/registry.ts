import type {
    AgentCapabilityConfig,
} from "@flex-builder/shared/capabilities";

import type {
    CapabilityPlugin,
    ExecutableAction,
    ResolvedCapability,
} from "./types";

export type CapabilityRegistry = ReadonlyMap<string, CapabilityPlugin>;

export function createCapabilityRegistry(
    plugins: CapabilityPlugin[],
): CapabilityRegistry {
    const registry =
        new Map<
            string,
            CapabilityPlugin
        >();

    for (const plugin of plugins) {
        const { id } = plugin.definition;

        if (registry.has(id)) {
            throw new Error(
                `Duplicate capability id "${id}"`,
            );
        }

        registry.set(id, plugin);
    }

    return registry;
}

export function getCapability(
    registry: CapabilityRegistry,
    capabilityId: string,
): CapabilityPlugin {
    const plugin = registry.get(capabilityId);

    if (plugin) {
        return plugin;
    }

    const available = [...registry.keys()].join(", ");

    throw new Error(
        available
            ? `Unknown capability "${capabilityId}". Available capabilities: ${available}`
            : `Unknown capability "${capabilityId}". No capabilities are available.`,
    );
}

export function listCapabilities(
    registry: CapabilityRegistry,
): CapabilityPlugin[] {
    return [
        ...registry.values(),
    ].sort(
        (
            a,
            b,
        ) =>
            a.definition.id.localeCompare(
                b.definition.id,
            ),
    );
}

export function loadCapabilities(
    registry: CapabilityRegistry,
    capabilityIds: string[],
): CapabilityPlugin[] {
    return [
        ...new Set(capabilityIds,),
    ].map((id) => getCapability(registry, id,));
}

export type ActionRegistry =
    Map<
        string,
        ExecutableAction
    >;

export function createActionRegistry(): ActionRegistry {
    return new Map();
}

export async function registerCapability<
    TContext extends object,
>(
    registry: ActionRegistry,
    plugin: CapabilityPlugin<TContext>,
): Promise<void> {
    const { definition, } = plugin;
    const actions = Object.entries(
        definition.actions,
    ).map(
        ([
            actionName,
            action,
        ]) => ({
            name:
                `${definition.id}.${actionName}`,
            action,
        }),
    );

    for (
        const { name } of actions) {
        if (registry.has(name)) {
            throw new Error(
                `Duplicate action "${name}"`,
            );
        }
    }

    const context = await plugin.createContext();

    for (const { name, action } of actions) {
        registry.set(
            name,
            (
                args,
                execution,
            ) =>
                action.execute(
                    args,
                    {
                        ...context,
                        signal:
                            execution.signal,
                    },
                ),
        );
    }
}


export function resolveCapabilities(
    registry: CapabilityRegistry,
    configs: AgentCapabilityConfig[],
): ResolvedCapability[] {
    return configs.map(
        ({
            id,
            access,
        }) => ({
            plugin:
                getCapability(
                    registry,
                    id,
                ),

            access,
        }),
    );
}