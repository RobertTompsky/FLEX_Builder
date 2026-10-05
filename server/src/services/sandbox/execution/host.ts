import { HostIpcTransport } from "./transport/host";
import type {
    ExecutionProcess,
} from "./process";

export type SpawnExecutionInput = {
    executionId: string;
    entryFile: string;
    userFile: string;
    cwd: string;
    env: Record<string, string>;
};

export interface ExecutionHost {
    spawn(
        input: SpawnExecutionInput
    ): Promise<ExecutionProcess>;
}

export class BunExecutionHost
    implements ExecutionHost {

    async spawn(
        input:
            SpawnExecutionInput,
    ): Promise<
        ExecutionProcess
    > {
        const {
            executionId,
            entryFile,
            userFile,
            cwd,
            env,
        } = input;

        const pendingMessages: unknown[] = [];

        let rpcTransport: HostIpcTransport | undefined;

        const child = Bun.spawn(
            [
                process.execPath,
                entryFile,
                userFile,
                executionId,
            ],
            {
                cwd,
                env,
                stdin: "ignore",
                stdout: "pipe",
                stderr: "pipe",
                ipc(message) {
                    // console.error(
                    //     "[ipc parent] RECEIVED",
                    //     message,
                    // );

                    if (rpcTransport) {
                        rpcTransport.receive(message);

                        return;
                    }

                    // console.error(
                    //     "[ipc parent] QUEUED BEFORE TRANSPORT",
                    // );

                    pendingMessages.push(message);
                },

                onDisconnect() {
                    rpcTransport
                        ?.disconnected();
                },
            },
        );

        rpcTransport = new HostIpcTransport(child);


        for (const message of pendingMessages) {
            rpcTransport.receive(message);
        }

        pendingMessages.length = 0;

        const stdout = child.stdout;

        const stderr = child.stderr;


        if (!(stdout instanceof ReadableStream)) {
            child.kill();

            throw new Error(
                "Execution stdout is not available",
            );
        }


        if (
            !(
                stderr instanceof
                ReadableStream
            )
        ) {
            child.kill();

            throw new Error(
                "Execution stderr is not available",
            );
        }


        return {
            pid: child.pid,
            rpc: rpcTransport,
            stdout,
            stderr,
            exited: child.exited,
            kill() {
                if (child.exitCode === null) {
                    child.kill();
                }
            },
        };
    }
}