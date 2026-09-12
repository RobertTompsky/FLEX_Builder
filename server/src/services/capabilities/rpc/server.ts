import type {
    CapabilityRpcCall,
    CapabilityRpcRequest,
    CapabilityRpcResponse,
} from "./types";

import {
    parseRpcMessage,
    serializeRpcMessage,
} from "./protocol";

export type CapabilityRpcExecutor = (
    request: CapabilityRpcCall,
    signal: AbortSignal,
) => Promise<unknown>;

type CreateCapabilityRpcServerInput = {
    execute: CapabilityRpcExecutor;
    writeLine: (
        line: string,
    ) => Promise<void>;
    signal?: AbortSignal;
};

const MAX_CONCURRENT_RPC_CALLS = 16;

export function createCapabilityRpcServer({
    execute,
    writeLine,
    signal
}: CreateCapabilityRpcServerInput) {
    const activeCalls =
        new Map<
            string,
            AbortController
        >();

    signal?.addEventListener(
        "abort",
        () => {
            for (
                const controller
                of activeCalls.values()
            ) {
                controller.abort();
            }

            activeCalls.clear();
        },
        {
            once: true,
        },
    );
    
    return async function handleLine(
        line: string,
    ): Promise<string | undefined> {
        const message =
            parseRpcMessage(
                line,
            );

        if (!message) {
            return line;
        }

        if (
            message.type ===
            "capability_cancel"
        ) {
            activeCalls
                .get(
                    message.id,
                )
                ?.abort();

            return undefined;
        }

        if (
            message.type !==
            "capability_call"
        ) {
            return undefined;
        }

        if (
            activeCalls.size >=
            MAX_CONCURRENT_RPC_CALLS
        ) {
            await writeLine(
                serializeRpcMessage({
                    type:
                        "capability_result",

                    id:
                        message.id,

                    ok:
                        false,

                    error:
                        `Too many concurrent capability calls. Max: ${MAX_CONCURRENT_RPC_CALLS}`,
                }),
            );

            return undefined;
        }

        const controller =
            new AbortController();

        activeCalls.set(
            message.id,
            controller,
        );

        void executeCall(
            message,
            controller,
        ).catch(
            (error) => {
                console.error(
                    "[CAPABILITY RPC ERROR]",
                    error,
                );
            },
        );

        return undefined;
    };

    async function executeCall(
        message: CapabilityRpcCall,
        controller: AbortController,
    ): Promise<void> {
        let response:
            CapabilityRpcResponse;

        try {
            const result =
                await execute(
                    message,
                    controller.signal,
                );

            response = {
                type:
                    "capability_result",

                id:
                    message.id,

                ok:
                    true,

                result,
            };
        } catch (error) {
            response = {
                type:
                    "capability_result",

                id:
                    message.id,

                ok:
                    false,

                error:
                    controller.signal.aborted
                        ? "Capability call aborted"
                        : error instanceof Error
                            ? error.message
                            : String(
                                error,
                            ),
            };
        }

        try {
            await writeLine(
                serializeRpcMessage(
                    response,
                ),
            );
        } finally {
            activeCalls.delete(
                message.id,
            );
        }
    }
}