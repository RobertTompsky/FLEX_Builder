import { ExecutionEventInput } from "@flex-builder/shared/sandbox";
import {
    RpcServer,
} from "../../rpc/server";

import {
    ExecuteRpcCall,
    ExecuteRpcInput,
    ExecuteRpcMethod,
} from "./protocol";

export class ExecuteRpcServer
    extends RpcServer {

    constructor(
        execute:
            ExecuteRpcCall,

        onEvent?:
            (
                input:
                    ExecutionEventInput,
            ) =>
                | void
                | Promise<void>,
    ) {
        super();

        const emitTrace = async (
            input:
                ExecuteRpcInput,

            phase:
                "request"
                | "response",
        ) => {
            if (!onEvent) {
                return;
            }

            const {
                executionId,
                input: {
                    capability,
                    action,
                },
            } = input;

            await onEvent({
                executionId,

                event: {
                    event:
                        "rpc_trace",

                    data: {
                        phase,
                        method:
                            "execute",
                        client:
                            "execution",
                        server:
                            "server",
                        capability,
                        action,
                    },
                },
            });
        };

        this.register<
            ExecuteRpcInput,
            unknown
        >(
            ExecuteRpcMethod.execute,

            async (
                input,
                signal,
            ) => {
                await emitTrace(
                    input,
                    "request",
                );

                try {
                    return await execute(
                        input,
                        {
                            signal,
                        },
                    );
                }
                finally {
                    await emitTrace(
                        input,
                        "response",
                    );
                }
            },
        );

        if (onEvent) {
            this.register<
                ExecutionEventInput,
                void
            >(
                ExecuteRpcMethod.executionEvent,

                async input => {
                    await onEvent(
                        input,
                    );
                },
            );
        }
    }
}