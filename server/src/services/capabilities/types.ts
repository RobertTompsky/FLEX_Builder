import z from "zod";

import {
    executeInputSchema,
    executeOutputSchema,
} from "./schemas";
import { CapabilityAccess, CapabilityContext } from "@flex-builder/shared/capabilities";
export type CapabilityExecution = {
    signal?: AbortSignal;
};
export type ExecutableAction = (
    args: unknown,
    execution: CapabilityExecution,
) => Promise<unknown>;

export type RuntimeAction<
    TContext extends CapabilityContext = CapabilityContext,
> = {
    description: string;
    inputSchema: z.ZodType;
    outputSchema: z.ZodType;

    execute(
        args: unknown,
        context: TContext,
    ): Promise<unknown>;
};

export type CapabilityActions = Record<string, RuntimeAction>;

export type CapabilityDefinition<
    TContext extends object = Record<string, never>,
> = {
    id: string;
    description: string;
    instructions?: string;

    actions: Record<
        string,
        RuntimeAction<TContext>
    >;
};

export type CapabilityExecutionContext = {
    signal?: AbortSignal;
};

export type EmptyContext =
    CapabilityExecutionContext;

export type CapabilityPlugin<
    TContext extends CapabilityExecutionContext =
        EmptyContext,
> = {
    definition:
        CapabilityDefinition<TContext>;

    createContext: () =>
        | TContext
        | Promise<TContext>;
};

export type ResolvedCapability = {
    plugin: CapabilityPlugin<any>;
    access: CapabilityAccess;
};

export type ExecuteInput = z.infer<typeof executeInputSchema>;

export type ExecuteOutput = z.infer<typeof executeOutputSchema>;

export type RuntimeExecute = (
    input: ExecuteInput,
    options?: {
        signal?: AbortSignal;
    },
) => Promise<ExecuteOutput>;

