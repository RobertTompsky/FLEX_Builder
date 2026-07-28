import type {
    CapabilityDefinition,
} from "./types";

/**
 * Preserves the exact inferred type while ensuring
 * that the value has the common capability shape.
 *
 * Skill declarations may omit id and instructions.
 * Built-in capabilities may provide them.
 */
export function defineCapability<
    TDefinition extends
    CapabilityDefinition,
>(
    definition: TDefinition,
): TDefinition {
    if (
        typeof definition.description !== "string" ||
        !definition.description.trim()
    ) {
        throw new Error(
            "Capability must contain a description",
        );
    }
    return definition;
}