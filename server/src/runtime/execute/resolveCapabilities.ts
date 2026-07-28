import { loadCapabilities } from "./loadCapabilities";
import { AgentCapabilityConfig } from "./schemas";
import { ResolvedCapability } from "./types";

export async function resolveCapabilities(
    capabilitiesDir: string,
    configs:
        AgentCapabilityConfig[],
): Promise<ResolvedCapability[]> {
    const definitions =
        await loadCapabilities(
            capabilitiesDir,
            configs.map(
                ({ id }) => id,
            ),
        );

    const registry =
        new Map(
            definitions.map(
                (definition) => [
                    definition.id,
                    definition,
                ],
            ),
        );

    return configs.map(
        ({
            id,
            access,
        }) => {
            const definition =
                registry.get(id);

            if (!definition) {
                throw new Error(
                    `Capability "${id}" was not loaded`,
                );
            }

            return {
                definition,
                access,
            };
        },
    );
}