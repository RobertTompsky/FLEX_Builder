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

        this.register<
            ExecuteRpcInput,
            unknown
        >(
            ExecuteRpcMethod.execute,

            (
                input,
                signal,
            ) =>
                execute(
                    input,
                    {
                        signal,
                    },
                ),
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