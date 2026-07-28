import z from "zod";

import type {
    CapabilityActions,
    RuntimeAction,
} from "../types";

function buildActionPrompt(
    capabilityId: string,
    actionName: string,
    action: RuntimeAction,
): string {
    const inputSchema =
        z.toJSONSchema(
            action.inputSchema,
        );

    const outputSchema =
        z.toJSONSchema(
            action.outputSchema,
        );

    return `
    ### ${capabilityId}.${actionName}
    
    ${action.description}
    
    Input schema:
    ${JSON.stringify(
        inputSchema,
        null,
        2,
    )}
    
    Successful output schema:
    ${JSON.stringify(
        outputSchema,
        null,
        2,
    )}
    `.trim();
}

export function buildActionsPrompt(
    capabilityId: string,
    actions: CapabilityActions,
): string {
    return Object.entries(
        actions,
    )
        .map(
            ([
                actionName,
                action,
            ]) =>
                buildActionPrompt(
                    capabilityId,
                    actionName,
                    action,
                ),
        )
        .join("\n\n");
}