import z from 'zod'
import { executeInputSchema, executeOutputSchema } from "./schemas";
import { SandboxEvent } from '@flex-builder/shared/sandbox';

export type ExecuteCall = (
    input: ExecuteInput,
    options?: ExecuteOptions,
) => Promise<unknown>;

export type ExecuteInput =
    z.infer<
        typeof executeInputSchema
    >;

export type ExecuteOutput =
    z.infer<
        typeof executeOutputSchema
    >;

export type ExecuteOptions = {
    signal?: AbortSignal;

    emit?: (
        event: SandboxEvent,
    ) => void | Promise<void>;
};

export const CapabilityRpcMethod = {
    execute: "capability/execute",
} as const;

export type CapabilityExecuteInput = ExecuteInput;

export type CapabilityExecuteResult = {
    output: unknown;
};