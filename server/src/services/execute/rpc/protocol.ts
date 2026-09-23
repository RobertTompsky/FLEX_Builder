import { ExecuteInput, ExecuteOptions } from "../types";

export const ExecuteRpcMethod = {
    execute: "execute",
} as const;

export type ExecuteRpcInput = {
    executionId:
        string;

    input:
        ExecuteInput;
};

export type ExecuteRpcResult = unknown;

export type ExecuteRpcCall = (
    input: ExecuteRpcInput,
    options?: ExecuteOptions,
) => Promise<unknown>;