import { SandboxRpcClient } from "./rpc/client";

import { RpcTransport } from "../rpc/transport";

export class SandboxService {
    readonly client = new SandboxRpcClient();

    async connect(
        transport: RpcTransport,
    ) {
        await this.client.connect(transport);
    }

    async close() {
        await this.client.close();
    }
}