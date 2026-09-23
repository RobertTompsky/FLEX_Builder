import type {
    Capability,
    ExecutionOptions,
} from "../capabilities/types";

import type {
    ExecuteCall,
} from "./types";

type CreateExecutorInput = {
    capabilities: Capability[],
    emit?: ExecutionOptions["emit"],
}

export function createExecutor(
    input: CreateExecutorInput
): ExecuteCall {
    const { capabilities, emit } = input
    const registry =
        new Map(
            capabilities.map(
                capability => [
                    capability.id,
                    capability,
                ],
            ),
        );

    return async (
        {
            capability,
            action,
            args,
        },
        {
            signal,
        } = {},
    ) => {
        signal?.throwIfAborted();

        const definition =
            registry.get(
                capability,
            );

        if (!definition) {
            throw new Error(
                `Capability "${capability}" not found`,
            );
        }

        const target =
            definition.actions[
            action
            ];

        if (!target) {
            throw new Error(
                `Action "${capability}.${action}" not found`,
            );
        }

        return target.execute({
            args,

            options: {
                signal,
                emit,
            },
        });
    };
}