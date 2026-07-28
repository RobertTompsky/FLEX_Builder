import z from "zod";

import {
    CapabilityAccessSchema,
    executeInputSchema,
    executeOutputSchema,
} from "./schemas";

export type RuntimeAction = {
    description: string;
    inputSchema: z.ZodType;
    outputSchema: z.ZodType;

    execute: (
        rawArgs: unknown,
    ) => Promise<unknown>;
};

export type CapabilityActions =
    Record<
        string,
        RuntimeAction
    >;

export type CapabilityDefinition = {
    id: string;
    description: string;
    instructions?: string;
    actions: CapabilityActions;
};

export type CapabilityAccess = z.infer<typeof CapabilityAccessSchema>

export type ResolvedCapability = {
    definition: CapabilityDefinition;
    access: CapabilityAccess;
};

export type ExecuteInput =
    z.infer<
        typeof executeInputSchema
    >;

export type ExecuteOutput =
    z.infer<
        typeof executeOutputSchema
    >;

export type RuntimeExecute = (
    input: ExecuteInput,
) => Promise<ExecuteOutput>;