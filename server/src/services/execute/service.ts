import type {
    RpcTransport,
} from "../rpc/transport";

import {
    createExecutionRegistry,
} from "./executionRegistry";

import {
    ExecuteRpcServer,
} from "./rpc";

export class ExecutionService {
    readonly executions = createExecutionRegistry();

    private readonly server = new ExecuteRpcServer(
        this.executions.execute,
        ({
            executionId,
            event,
        }) =>
            this.executions.emit(
                executionId,
                event,
            ),
    );

    async connect(transport: RpcTransport) {
        await this.server.connect(transport);
    }

    async close() {
        await this.server.close();
    }
}