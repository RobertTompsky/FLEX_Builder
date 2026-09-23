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
    }
}