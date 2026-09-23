import {
    RpcClient,
} from "../../rpc/client";

import {
    ExecuteRpcInput,
    ExecuteRpcMethod,
} from "./protocol";

import type {
    ExecuteRpcCall,
} from "./protocol";

export class ExecuteRpcClient
    extends RpcClient {

    execute: ExecuteRpcCall =
        async (
            input,
            options,
        ) => {
            return this.call<
                unknown,
                ExecuteRpcInput
            >(
                ExecuteRpcMethod.execute,
                input,
                {
                    signal:
                        options?.signal,
                },
            );
        };
}