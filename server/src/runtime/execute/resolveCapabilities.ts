import path from "node:path";

import {
    readdir,
} from "fs-extra";

import {
    pathToFileURL,
} from "node:url";

import type {
    CapabilityDefinition,
    ResolvedCapability,
    RuntimeAction,
} from "./types";
import { AgentCapabilityConfig } from "@flex-builder/shared/capabilities";

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

function isNonEmptyString(value: unknown): value is string {
    return (
        typeof value === "string" &&
        value.trim().length > 0
    );
}

function isCapabilityDefinitionCandidate(
    value: unknown,
): value is Record<PropertyKey, unknown> {
    return (
        isRecord(value) &&
        "id" in value &&
        "description" in value &&
        "actions" in value
    );
}

function assertRuntimeAction(
    value: unknown,
    actionName: string,
): asserts value is RuntimeAction {
    if (!isRecord(value)) {
        throw new Error(
            `Invalid runtime action "${actionName}": expected an object`,
        );
    }

    if (!isNonEmptyString(value.description,)) {
        throw new Error(
            `Invalid runtime action "${actionName}": description must be a non-empty string`,
        );
    }

    if (!isRecord(value.inputSchema,)) {
        throw new Error(
            `Invalid runtime action "${actionName}": inputSchema must be an object`,
        );
    }

    if (!isRecord(value.outputSchema,)) {
        throw new Error(
            `Invalid runtime action "${actionName}": outputSchema must be an object`,
        );
    }

    if (typeof value.execute !== "function") {
        throw new Error(
            `Invalid runtime action "${actionName}": execute must be a function`,
        );
    }
}

function assertCapabilityDefinition(
    value: unknown,
    modulePath: string,
): asserts value is CapabilityDefinition {
    if (!isRecord(value)) {
        throw new Error(
            `Invalid capability definition exported from "${modulePath}"`,
        );
    }

    if (!isNonEmptyString(value.id)) {
        throw new Error(
            `Invalid capability id exported from "${modulePath}"`,
        );
    }

    if (!isNonEmptyString(value.description,)) {
        throw new Error(
            `Invalid description in capability "${value.id}"`,
        );
    }

    if (!isRecord(value.actions)) {
        throw new Error(
            `Invalid actions in capability "${value.id}"`,
        );
    }

    if (
        value.instructions !== undefined &&
        typeof value.instructions !== "string"
    ) {
        throw new Error(
            `Invalid instructions in capability "${value.id}"`,
        );
    }

    for (const [name, action] of Object.entries(value.actions,)) {
        assertRuntimeAction(action, `${value.id}.${name}`,);
    }
}

function extractCapabilityDefinition(
    module: Record<string, unknown>,
    filePath: string,
): CapabilityDefinition {
    const candidates =
        Object.entries(module)
            .filter(
                ([, value]) =>
                    isCapabilityDefinitionCandidate(
                        value,
                    ),
            );

    if (candidates.length === 0) {
        throw new Error(
            `No capability definition exported from "${filePath}"`,
        );
    }

    if (candidates.length > 1) {
        throw new Error(
            `Multiple capability definitions exported from "${filePath}": ${
                candidates
                    .map(
                        ([exportName]) =>
                            exportName,
                    )
                    .join(", ")
            }`,
        );
    }

    const [
        exportName,
        definition,
    ] = candidates[0];

    assertCapabilityDefinition(
        definition,
        `${filePath}#${exportName}`,
    );

    return definition;
}

async function loadCapabilityModule(
    modulePath: string,
): Promise<CapabilityDefinition> {
    const moduleUrl =
        pathToFileURL(
            modulePath,
        ).href;

    const module: Record<string, unknown> =
        await import(
            moduleUrl,
        );

    return extractCapabilityDefinition(
        module,
        modulePath,
    );
}

async function findCapabilityModules(
    capabilitiesDir: string,
): Promise<string[]> {
    const entries = await readdir(
        capabilitiesDir,
        {
            withFileTypes: true,
        },
    );

    const candidates =
        entries
            .filter(
                (entry) =>
                    entry.isDirectory(),
            )
            .map(
                (entry) =>
                    path.join(
                        capabilitiesDir,
                        entry.name,
                        "capability.ts",
                    ),
            );

    const existing =
        await Promise.all(
            candidates.map(
                async (modulePath) => ({
                    modulePath,
                    exists: await Bun.file(modulePath,).exists(),
                }),
            ),
        );

    return existing
        .filter(({ exists }) => exists,)
        .map(({ modulePath }) => modulePath,);
}

function createCapabilityRegistry(
    capabilities: CapabilityDefinition[],
): Map<string, CapabilityDefinition> {
    const registry =
        new Map<
            string,
            CapabilityDefinition
        >();

    for (const capability of capabilities) {
        if (registry.has(capability.id,)) {
            throw new Error(
                `Duplicate capability id "${capability.id}"`,
            );
        }

        registry.set(
            capability.id,
            capability,
        );
    }

    return registry;
}

function getCapability(
    registry: ReadonlyMap<string, CapabilityDefinition>,
    capabilityId: string,
): CapabilityDefinition {
    const capability = registry.get(capabilityId);

    if (capability) {
        return capability;
    }

    const available = [...registry.keys()].join(", ");

    throw new Error(
        available
            ? `Unknown capability "${capabilityId}". Available capabilities: ${available}`
            : `Unknown capability "${capabilityId}". No capabilities are available.`,
    );
}

async function loadCapabilityRegistry(
    capabilitiesDir: string,
): Promise<Map<string, CapabilityDefinition>> {
    const modulePaths = await findCapabilityModules(capabilitiesDir,);

    const capabilities =
        await Promise.all(
            modulePaths.map(
                loadCapabilityModule,
            ),
        );

    return createCapabilityRegistry(capabilities,);
}

export async function listCapabilities(
    capabilitiesDir: string,
): Promise<CapabilityDefinition[]> {
    const registry =
        await loadCapabilityRegistry(
            capabilitiesDir,
        );

    return [...registry.values()]
        .sort(
            (a, b) =>
                a.id.localeCompare(
                    b.id,
                ),
        );
}

export async function loadCapabilities(
    capabilitiesDir: string,
    capabilityIds: string[],
): Promise<CapabilityDefinition[]> {
    const registry =
        await loadCapabilityRegistry(
            capabilitiesDir,
        );

    return [...new Set(capabilityIds)]
        .map(
            (id) =>
                getCapability(
                    registry,
                    id,
                ),
        );
}

export async function resolveCapabilities(
    capabilitiesDir: string,
    configs: AgentCapabilityConfig[],
): Promise<ResolvedCapability[]> {
    const registry = await loadCapabilityRegistry(
        capabilitiesDir,
    );

    return configs.map(
        ({ id, access }) => ({
            definition:
                getCapability(
                    registry,
                    id,
                ),
            access,
        }),
    );
}