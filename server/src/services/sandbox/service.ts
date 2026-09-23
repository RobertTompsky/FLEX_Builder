import { createExecutionRegistry, ExecutionRegistry } from "../execute/executionRegistry";
import { ExecuteRpcServer } from "../execute/rpc";
import { ChildProcessTransport } from "../rpc/stdio/childProcess";
import { SandboxRpcClient } from "./rpc/client";
import path from "path";
import { SandboxExecutionRuntime } from "./types";

const sandboxEntry = path.join(
    import.meta.dir,
    "./server-entry.ts",
);

export class SandboxService {
    readonly runtime:
        SandboxExecutionRuntime;

    private readonly transport:
        ChildProcessTransport;

    private readonly executeServer:
        ExecuteRpcServer;

    constructor() {
        this.transport =
            new ChildProcessTransport({
                command:
                    "bun",

                args: [
                    sandboxEntry,
                ],

                cwd:
                    process.cwd(),

                stderr:
                    "inherit",
            });

        const client =
            new SandboxRpcClient();

        const executions =
            createExecutionRegistry();

        this.runtime = {
            client,
            executions,
        };

        this.executeServer =
            new ExecuteRpcServer(
                executions.execute,
            );
    }

    async connect() {
        await this.runtime.client.connect(
            this.transport,
        );

        await this.executeServer.connect(
            this.transport,
        );
    }

    async close() {
        await this.executeServer.close();

        await this.runtime.client.close();

        await this.transport.close();
    }
}