import type {
    ExecuteCall,
} from "./types";

import type {
    ExecuteRpcCall,
} from "./rpc/protocol";

import type {
    ExecutionEvent,
} from "@flex-builder/shared/sandbox";

type ExecutionEntry = {
    execute: ExecuteCall;
    onEvent?: (event: ExecutionEvent) =>
        | void
        | Promise<void>;
};

export function createExecutionRegistry() {
    const executions = new Map<string, ExecutionEntry>();

    const execute: ExecuteRpcCall = async (
        {
            executionId,
            input,
        },
        options,
    ) => {

        const execution = executions.get(executionId);

        if (!execution) {
            throw new Error(
                `Unknown execution "${executionId}"`,
            );
        }

        return execution.execute(
            input,
            options,
        );
    };

    return {
        register(
            executionId: string,
            execute: ExecuteCall,
            onEvent?: ExecutionEntry["onEvent"],
        ): void {

            executions.set(
                executionId,
                {
                    execute,
                    onEvent,
                },
            );
        },

        async emit(
            executionId: string,
            event: ExecutionEvent,
        ): Promise<void> {

            await executions
                .get(executionId)
                ?.onEvent?.(event);
        },

        delete(executionId: string): void {
            executions.delete(executionId);
        },

        execute,
    };
}

export type ExecutionRegistry =
    ReturnType<
        typeof createExecutionRegistry
    >;