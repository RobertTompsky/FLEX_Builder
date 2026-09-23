import {
    randomUUID,
} from "crypto";

import type {
    ExecuteCall,
} from "./types";
import { ExecuteRpcCall } from "./rpc/protocol";

export function createExecutionRegistry() {
    const executions =
        new Map<
            string,
            ExecuteCall
        >();

    const execute: ExecuteRpcCall = async (
        {
            executionId,
            input,
        },
        options,
    ) => {
        const target = executions.get(executionId);

        if (!target) {
            throw new Error(
                `Unknown execution "${executionId}"`,
            );
        }

        return target(
            input,
            options,
        );
    };

    return {
        register(
            target: ExecuteCall,
        ): string {
            const executionId = `exec_${randomUUID()}`;

            executions.set(executionId, target);

            return executionId;
        },

        delete(
            executionId: string,
        ): void {
            executions.delete(executionId);
        },

        execute,
    };
}

export type ExecutionRegistry =
    ReturnType<
        typeof createExecutionRegistry
    >;