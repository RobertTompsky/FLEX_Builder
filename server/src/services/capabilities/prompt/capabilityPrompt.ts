import z from "zod";

import {
    CapabilityAccess,
} from "@flex-builder/shared/capabilities";

import {
    buildActionsPrompt,
} from "./actionsPrompt";

export type CapabilityPromptInput = {
    id: string;

    description: string;

    instructions?: string;

    access:
        CapabilityAccess;

    actions: Record<
        string,
        {
            description: string;
            inputSchema: z.ZodType;
            outputSchema: z.ZodType;
        }
    >;
};

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

        case "orchestrate":
            return [
                "You cannot use this capability directly.",
                "You may delegate work requiring this capability to a subagent.",
            ].join("\n");

        case "both":
            return [
                "You may use this capability directly through execute.",
                "You may also delegate work requiring it to a subagent.",
            ].join("\n");
    }
}

export function buildCapabilityPrompt(
    capability:
        CapabilityPromptInput,
): string {
    const executable =
        canExecute(
            capability.access,
        );

    const sections: string[] = [
        `## Capability: ${capability.id}`,

        [
            "Description:",
            capability.description,
        ].join("\n"),

        [
            "Access:",
            buildAccessPrompt(
                capability.access,
            ),
        ].join("\n"),
    ];

    if (
        executable &&
        capability.instructions
            ?.trim()
    ) {
        sections.push(
            [
                "Instructions:",
                capability.instructions
                    .trim(),
            ].join("\n"),
        );
    }

    if (executable) {
        const actionsPrompt =
            buildActionsPrompt(
                capability.id,
                capability.actions,
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
        CapabilityPromptInput[],
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