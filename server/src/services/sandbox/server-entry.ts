import {
    StdioTransport,
} from "../rpc/stdio/stdio";

import {
    RpcRelay,
} from "../rpc/relay";

import {
    SandboxRpcServer,
} from "./rpc/server";

import {
    SandboxRuntime,
} from "./runtime";
import { ExecuteRpcMethod } from "../execute/rpc/protocol";

const transport = new StdioTransport();

const relay = new RpcRelay({
    upstream: transport,
    maxConcurrency: 4,
});

const runtime = new SandboxRuntime({
    relay,
    async emitExecutionEvent(
        executionId,
        event,
    ) {
        await transport.send({
            jsonrpc: "2.0",
            method: ExecuteRpcMethod.executionEvent,
            params: {
                executionId,
                event,
            },
        });
    },
});

const sandboxServer = new SandboxRpcServer(runtime);

await sandboxServer.connect(transport);

relay.connect();

console.error(
    "[sandbox] service started",
);

let shuttingDown = false;

async function shutdown(
    code = 0,
) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    relay.close();

    await sandboxServer.close();

    await transport.close();

    process.exit(
        code,
    );
}


process.stdin.once(
    "close",
    () => {
        void shutdown();
    },
);


process.once(
    "SIGINT",
    () => {
        void shutdown(
            130,
        );
    },
);


process.once(
    "SIGTERM",
    () => {
        void shutdown(
            143,
        );
    },
);