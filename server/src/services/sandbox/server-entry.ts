
import {
    StdioTransport,
} from "../rpc/stdio/stdio";

import {
    ExecuteRpcClient,
} from "../execute/rpc";

import {
    SandboxRpcServer,
} from "./rpc/server";

import {
    SandboxRuntime,
} from "./runtime";

const transport = new StdioTransport();

const executeClient = new ExecuteRpcClient();

const runtime = new SandboxRuntime(executeClient);

const sandboxServer = new SandboxRpcServer(runtime);

await Promise.all([
    sandboxServer.connect(transport),
    executeClient.connect(transport),
]);

console.error("[sandbox] service started");

console.error("[sandbox] server started");

let shuttingDown = false;

async function shutdown(code = 0) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    await sandboxServer.close();

    await executeClient.close();

    await transport.close();

    process.exit(code);
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