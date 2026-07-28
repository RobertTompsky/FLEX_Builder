import type {
    ResolvedCapability,
    CapabilityAccess,
} from "../types";

import {
    buildActionsPrompt,
} from "./actionsPrompt";

function canExecute(
    access: CapabilityAccess,
): boolean {
    return (
        access === "execute" ||
        access === "both"
    );
}

function buildAccessPrompt(
    access: CapabilityAccess,
): string {
    switch (access) {
        case "execute":
            return [
                "You may use this capability directly through execute.",
                "Do not delegate this capability to a subagent.",
            ].join("\n");

        case "delegate":
            return [
                "You cannot use this capability directly.",
                "You may delegate work requiring this capability to a subagent.",
            ].join("\n");

        case "both":
            return [
                "You may use this capability directly through execute",
                "or delegate work requiring it to a subagent.",
            ].join("\n");
    }
}

export function buildCapabilityPrompt({
    definition,
    access,
}: ResolvedCapability): string {
    const executable =
        canExecute(
            access,
        );

    const sections:
        string[] = [
            `## Capability: ${definition.id}`,

            [
                "Description:",
                definition.description,
            ].join("\n"),

            [
                "Access:",
                buildAccessPrompt(
                    access,
                ),
            ].join("\n"),
        ];

    if (
        executable &&
        definition.instructions
            ?.trim()
    ) {
        sections.push(
            [
                "Instructions:",
                definition.instructions
                    .trim(),
            ].join("\n"),
        );
    }

    if (executable) {
        const actionsPrompt =
            buildActionsPrompt(
                definition.id,
                definition.actions,
            );

        if (actionsPrompt) {
            sections.push(
                [
                    "Available actions:",
                    actionsPrompt,
                ].join("\n\n"),
            );
        }
    }

    return sections.join(
        "\n\n",
    );
}

export function buildCapabilitiesPrompt(
    capabilities:
        ResolvedCapability[],
): string {
    if (
        capabilities.length === 0
    ) {
        return "";
    }

    return [
        "# Capabilities",

        capabilities
            .map(
                buildCapabilityPrompt,
            )
            .join("\n\n"),
    ].join("\n\n");
}