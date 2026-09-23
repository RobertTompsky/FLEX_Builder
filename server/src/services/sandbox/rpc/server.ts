import {
    RpcServer,
} from "../../rpc/server";

import type {
    SandboxRuntime,
} from "../runtime";

import type {
    SandboxRunInput,
    SandboxRunResult,
} from "../types";

export class SandboxRpcServer
    extends RpcServer {

    constructor(
        runtime: SandboxRuntime,
    ) {
        super();

        this.register<
            SandboxRunInput,
            SandboxRunResult
        >(
            "sandbox/run",
            (
                input,
                signal,
            ) =>
                runtime.run(
                    input,
                    signal,
                ),
        );
    }
}