import type {
    AgentCapabilityConfig,
} from "@flex-builder/shared/capabilities";

import type {
    Capability,
} from "../../services/capabilities/types";
import { 
    CapabilityPromptInput 
} from "../../services/capabilities/prompt/capabilityPrompt";

export function resolvePromptCapabilities(
    configs: AgentCapabilityConfig[],
    capabilities: Capability[],
): CapabilityPromptInput[] {
    return configs.map(
        ({
            id,
            access,
        }) => {
            const capability = capabilities.find(
                capability => capability.id === id
            );

            if (!capability) {
                throw new Error(
                    `Unknown capability "${id}"`,
                );
            }

            return {
                id: capability.id,
                description: capability.description,
                instructions: capability.instructions,
                actions: capability.actions,
                access,
            };
        },
    );
}

export function resolveExecutableCapabilities(
    configs: AgentCapabilityConfig[],
    capabilities: Capability[],
): Capability[] {
    return configs
        .filter(
            config =>
                config.access ===
                "execute" ||
                config.access ===
                "both",
        )
        .map(
            config => {
                const capability =
                    capabilities.find(
                        capability =>
                            capability.id ===
                            config.id,
                    );

                if (!capability) {
                    throw new Error(
                        `Unknown capability "${config.id}"`,
                    );
                }

                return capability;
            },
        );
}