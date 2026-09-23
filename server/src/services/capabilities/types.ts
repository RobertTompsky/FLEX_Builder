import z from 'zod'
import { CapabilityEvent } from "@flex-builder/shared/capabilities";

export type ExecutionOptions = {
    signal?:
        AbortSignal;

    emit?(
        event: CapabilityEvent,
    ):
        | void
        | Promise<void>;
};

export type ActionInput<
    TArgs = unknown,
> = {
    args: TArgs;
    options: ExecutionOptions;
};

export type Action = {
    description: string;

    inputSchema:
        z.ZodType;

    outputSchema:
        z.ZodType;

    execute(
        input: ActionInput,
    ): Promise<unknown>;
};

export type Capability = {
    id: string;
    description: string;
    instructions?: string;

    actions: Record<
        string,
        Action
    >;
};