import {
    RpcClient,
} from "../../rpc/client";

import type {
    RpcCallOptions,
} from "../../rpc/client";

import type {
    SandboxRunInput,
    SandboxRunResult,
} from "../types";

export class SandboxRpcClient
    extends RpcClient {

    run(
        input: SandboxRunInput,
        options?: RpcCallOptions,
    ): Promise<SandboxRunResult> {
        return this.call<
            SandboxRunResult,
            SandboxRunInput
        >(
            "sandbox/run",
            input,
            options,
        );
    }
}