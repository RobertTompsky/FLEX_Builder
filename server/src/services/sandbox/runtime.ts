import {
    unlink,
    writeFile,
} from "fs-extra";

import path from "path";

import {
    randomUUID,
} from "crypto";

import type {
    SandboxRunInput,
    SandboxRunResult,
} from "./types";
import { ExecuteRpcClient, ExecuteRpcServer } from "../execute/rpc";
import { ExecutionHostTransport } from "./execution/host";
import { RpcTransport } from "../rpc/transport";

export class SandboxRuntime {
    constructor(
        private readonly executeClient:
            ExecuteRpcClient,
    ) { }

    async run(
        input: SandboxRunInput,
        signal: AbortSignal,
    ): Promise<SandboxRunResult> {
        const {
            executionId,
            code,
            cwd:
            inputCwd,
            timeoutMs:
            inputTimeoutMs,
        } = input;

        const cwd = inputCwd ?? process.cwd();

        const timeoutMs = inputTimeoutMs ?? 10_000;

        const userFile = path.join(
            cwd,
            `.sandbox-${randomUUID()}.ts`,
        );

        await writeFile(
            userFile,
            code,
            "utf8",
        );

        const controller = new AbortController();

        const onAbort = () => {
            controller.abort(
                signal.reason,
            );
        };

        signal.addEventListener(
            "abort",
            onAbort,
            {
                once: true,
            },
        );

        const timeout = setTimeout(
            () => {
                controller.abort(
                    new Error(
                        "Sandbox execution timed out",
                    ),
                );
            },
            timeoutMs,
        );

        let executeServer: ExecuteRpcServer | undefined;

        let executionTransport: RpcTransport | undefined;

        try {
            const entryFile = path.join(
                import.meta.dir,
                "./execution/entry.ts",
            );

            const process = Bun.spawn(
                [
                    "bun",
                    entryFile,
                    userFile,
                    executionId,
                ],
                {
                    cwd,
                    stdin: "pipe",
                    stdout: "pipe",
                    stderr: "pipe",
                },
            );

            const stdin = process.stdin;

            if (!stdin || typeof stdin === "number") {
                process.kill();

                throw new Error(
                    "Sandbox stdin is not available",
                );
            }

            const stdout = process.stdout;

            if (!(stdout instanceof ReadableStream)) {
                process.kill();

                throw new Error(
                    "Sandbox stdout is not available",
                );
            }

            const stdoutLines: string[] = [];

            executionTransport = new ExecutionHostTransport({
                stdout,

                async writeLine(line) {
                    stdin.write(line + "\n");

                    await stdin.flush();
                },

                onStdout(line) {
                    stdoutLines.push(line);
                },
            });

            executeServer = new ExecuteRpcServer(
                (
                    input,
                    options,
                ) =>
                    this.executeClient.execute(
                        input,
                        options,
                    ),
            );

            await executeServer.connect(executionTransport);

            const kill = () => {
                if (
                    process.exitCode ===
                    null
                ) {
                    process.kill();
                }
            };

            controller.signal
                .addEventListener(
                    "abort",
                    kill,
                    {
                        once: true,
                    },
                );

            const [
                stderr,
                exitCode,
            ] =
                await Promise.all([
                    new Response(
                        process.stderr,
                    ).text(),

                    process.exited,
                ]);

            const timedOut =
                controller.signal.aborted &&
                !signal.aborted;

            if (signal.aborted) {
                throw (
                    signal.reason ??
                    new DOMException(
                        "The operation was aborted",
                        "AbortError",
                    )
                );
            }

            const stdoutText = stdoutLines.length
                ? stdoutLines.join(
                    "\n",
                ) + "\n"
                : "";

            return {
                stdout: stdoutText,
                stderr,
                exitCode,
                timedOut,
            };
        } finally {
            clearTimeout(
                timeout,
            );

            await executeServer?.close();

            await executionTransport?.close();

            signal.removeEventListener(
                "abort",
                onAbort,
            );

            await unlink(userFile).catch(() => { },);
        }
    }
}