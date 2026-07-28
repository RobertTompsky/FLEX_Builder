import path from "node:path";

import {
    readdir,
} from "fs-extra";

import {
    pathToFileURL,
} from "node:url";

import type {
    CapabilityDefinition,
    RuntimeAction,
} from "./types";

function assertRuntimeAction(
    value: unknown,
    actionName: string,
): asserts value is RuntimeAction {
    if (
        !value ||
        typeof value !== "object" ||
        !(
            "description" in value
        ) ||
        typeof value.description !==
            "string" ||
        value.description.trim()
            .length === 0 ||
        !(
            "inputSchema" in value
        ) ||
        !value.inputSchema ||
        typeof value.inputSchema !==
            "object" ||
        !(
            "outputSchema" in value
        ) ||
        !value.outputSchema ||
        typeof value.outputSchema !==
            "object" ||
        !(
            "execute" in value
        ) ||
        typeof value.execute !==
            "function"
    ) {
        throw new Error(
            `Invalid runtime action "${actionName}"`,
        );
    }
}

function assertCapabilityDefinition(
    value: unknown,
    modulePath: string,
): asserts value is CapabilityDefinition {
    if (
        !value ||
        typeof value !== "object" ||
        !(
            "id" in value
        ) ||
        typeof value.id !==
            "string" ||
        value.id.trim()
            .length === 0 ||
        !(
            "description" in value
        ) ||
        typeof value.description !==
            "string" ||
        value.description.trim()
            .length === 0 ||
        !(
            "actions" in value
        ) ||
        !value.actions ||
        typeof value.actions !==
            "object" ||
        Array.isArray(
            value.actions,
        )
    ) {
        throw new Error(
            `Invalid capability definition exported from "${modulePath}"`,
        );
    }

    if (
        "instructions" in value &&
        value.instructions !==
            undefined &&
        typeof value.instructions !==
            "string"
    ) {
        throw new Error(
            `Invalid instructions in capability "${value.id}"`,
        );
    }
}

function validateCapabilityActions(
    capability:
        CapabilityDefinition,
): void {
    for (
        const [
            actionName,
            action,
        ] of Object.entries(
            capability.actions,
        )
    ) {
        assertRuntimeAction(
            action,
            `${capability.id}.${actionName}`,
        );
    }
}

async function loadCapabilityModule(
    modulePath: string,
): Promise<CapabilityDefinition> {
    const moduleUrl =
        pathToFileURL(
            modulePath,
        ).href;

    const capabilityModule =
        await import(
            moduleUrl
        );

    const definition:
        unknown =
        capabilityModule.default;

    assertCapabilityDefinition(
        definition,
        modulePath,
    );

    validateCapabilityActions(
        definition,
    );

    return definition;
}

async function findCapabilityModules(
    capabilitiesDir: string,
): Promise<string[]> {
    const entries =
        await readdir(
            capabilitiesDir,
            {
                withFileTypes: true,
            },
        );

    const modulePaths:
        string[] = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }

        const modulePath =
            path.join(
                capabilitiesDir,
                entry.name,
                "capability.ts",
            );

        const moduleFile =
            Bun.file(
                modulePath,
            );

        if (
            await moduleFile.exists()
        ) {
            modulePaths.push(
                modulePath,
            );
        }
    }

    return modulePaths;
}

function createCapabilityRegistry(
    capabilities:
        CapabilityDefinition[],
): Map<
    string,
    CapabilityDefinition
> {
    const registry =
        new Map<
            string,
            CapabilityDefinition
        >();

    for (
        const capability
        of capabilities
    ) {
        const existing =
            registry.get(
                capability.id,
            );

        if (existing) {
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

export async function loadCapabilityRegistry(
    capabilitiesDir: string,
): Promise<
    Map<
        string,
        CapabilityDefinition
    >
> {
    const modulePaths =
        await findCapabilityModules(
            capabilitiesDir,
        );

    const capabilities =
        await Promise.all(
            modulePaths.map(
                loadCapabilityModule,
            ),
        );

    return createCapabilityRegistry(
        capabilities,
    );
}

export async function loadCapabilities(
    capabilitiesDir: string,
    capabilityIds: string[],
): Promise<
    CapabilityDefinition[]
> {
    const registry =
        await loadCapabilityRegistry(
            capabilitiesDir,
        );

    const uniqueIds =
        [...new Set(
            capabilityIds,
        )];

    return uniqueIds.map(
        (capabilityId) => {
            const capability =
                registry.get(
                    capabilityId,
                );

            if (!capability) {
                const available =
                    [...registry.keys()]
                        .join(", ");

                throw new Error(
                    available
                        ? `Unknown capability "${capabilityId}". Available capabilities: ${available}`
                        : `Unknown capability "${capabilityId}". No capabilities are available.`,
                );
            }

            return capability;
        },
    );
}