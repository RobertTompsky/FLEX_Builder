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
import { ExecutionEvent } from "@flex-builder/shared/sandbox";
import { createExecutionEnv } from "./execution/env";
import { validateCode } from "./execution/validateCode";

const DEFAULT_TIMEOUT_MS = 10_000;

const MAX_OUTPUT_BYTES = 1_000_000;

export class SandboxRuntime {

    constructor(
        private readonly executeClient:
            ExecuteRpcClient,
    ) { }


    private async emit(
        executionId: string,
        event: ExecutionEvent,
    ): Promise<void> {

        try {
            await this.executeClient
                .emitEvent({
                    executionId,
                    event,
                });

        } catch (error) {
            console.error(
                "[sandbox:event]",
                error,
            );
        }
    }


    async run(
        input: SandboxRunInput,
        signal: AbortSignal,
    ): Promise<SandboxRunResult> {

        signal.throwIfAborted();

        const {
            executionId,
            code,
            cwd: inputCwd,
            timeoutMs: inputTimeoutMs,
        } = input;


        const validationError = validateCode(code);

        if (validationError) {
            await this.emit(
                executionId,
                {
                    event: "rpc_trace",
                    data: {
                        phase: "response",
                        method: "sandbox/run",
                        client: "server",
                        server: "sandbox",
                    },
                },
            );

            return {
                stdout: `[BLOCKED] ${validationError}`,
                stderr: "",
                exitCode: 0,
                timedOut: false,
            };
        }


        const cwd = inputCwd ?? process.cwd();

        const timeoutMs = inputTimeoutMs ?? DEFAULT_TIMEOUT_MS;

        const userFile = path.join(
            cwd,
            `.sandbox-${randomUUID()}.ts`,
        );

        const controller = new AbortController();

        let timedOut = false;

        let outputExceeded = false;

        let outputBytes = 0;

        const onAbort = () => {
            if (controller.signal.aborted) {
                return;
            }

            controller.abort(signal.reason);
        };


        signal.addEventListener(
            "abort",
            onAbort,
            {
                once:
                    true,
            },
        );

        // Covers the small race between
        // throwIfAborted() and addEventListener().
        if (signal.aborted) {
            onAbort();
        }

        let timeout: ReturnType<typeof setTimeout> | undefined;

        let executeServer: ExecuteRpcServer | undefined;

        let executionTransport: RpcTransport | undefined;

        let killProcess: (() => void) | undefined;

        const reserveOutput = (bytes: number): boolean => {
            if (controller.signal.aborted) {
                return false;
            }

            if (outputBytes + bytes <= MAX_OUTPUT_BYTES) {
                outputBytes += bytes;

                return true;
            }

            outputExceeded = true;

            controller.abort(
                new Error(
                    "Sandbox output limit exceeded",
                ),
            );

            return false;
        };


        try {
            await writeFile(
                userFile,
                code,
                "utf8",
            );

            controller.signal.throwIfAborted();

            const entryFile = path.join(
                import.meta.dir,
                "./execution/entry.ts",
            );

            const child = Bun.spawn(
                [
                    "bun",
                    entryFile,
                    userFile,
                    executionId,
                ],
                {
                    cwd,
                    env: createExecutionEnv(),
                    stdin: "pipe",
                    stdout: "pipe",
                    stderr: "pipe",
                },
            );


            killProcess = () => {
                if (child.exitCode === null) {
                    child.kill();
                }
            };

            controller.signal.addEventListener(
                "abort",
                killProcess,
                {
                    once:
                        true,
                },
            );

            if (controller.signal.aborted) {
                killProcess();
            }

            timeout = setTimeout(() => {
                if (controller.signal.aborted) {
                    return;
                }

                timedOut = true;

                controller.abort(
                    new Error(
                        "Sandbox execution timed out",
                    ),
                );
            },
                timeoutMs,
            );


            await this.emit(
                executionId,
                {
                    event: "started",
                    data: {
                        pid: child.pid,
                    },
                },
            );

            const stdin = child.stdin;

            if (!stdin || typeof stdin === "number") {
                throw new Error(
                    "Sandbox stdin is not available",
                );
            }

            const stdout = child.stdout;

            if (!(stdout instanceof ReadableStream)) {
                throw new Error(
                    "Sandbox stdout is not available",
                );
            }

            const stderr = child.stderr;

            if (!(stderr instanceof ReadableStream)) {
                throw new Error(
                    "Sandbox stderr is not available",
                );
            }


            /*
             * Limit the physical streams before anything
             * starts accumulating their contents.
             *
             * stdout includes both user output and execution RPC,
             * which is intentional here: an execution process
             * should not be able to emit unlimited data through
             * either channel.
             */
            const limitedStdout =
                limitReadableStream(
                    stdout,
                    reserveOutput,
                );

            const limitedStderr =
                limitReadableStream(
                    stderr,
                    reserveOutput,
                );


            const stdoutLines: string[] = [];

            executionTransport = new ExecutionHostTransport({
                stdout:
                    limitedStdout,

                async writeLine(line) {
                    stdin.write(line + "\n");

                    await stdin.flush();
                },

                onStdout(line) {
                    stdoutLines.push(line);
                },
            });


            executeServer =
                new ExecuteRpcServer(
                    async (
                        executeInput,
                        options,
                    ) => {
                        const {
                            input: {
                                capability,
                                action
                            }
                        } = executeInput;


                        await this.emit(
                            executionId,
                            {
                                event:                                    "rpc_trace",
                                data: {
                                    phase:                                        "request",
                                    method:                                        "execute",
                                    client:                                        "execution",
                                    server:                                        "sandbox",
                                    capability,
                                    action,
                                },
                            },
                        );


                        await this.emit(
                            executionId,
                            {
                                event:                                    "rpc_trace",

                                data: {
                                    phase:                                        "request",
                                    method:                                        "execute",
                                    client:                                       "sandbox",
                                    server:                                        "server",
                                    capability,
                                    action,
                                },
                            },
                        );


                        try {
                            return await this
                                .executeClient
                                .execute(
                                    executeInput,
                                    options,
                                );

                        } finally {
                            await this.emit(
                                executionId,
                                {
                                    event:                                        "rpc_trace",
                                    data: {
                                        phase:                                            "response",
                                        method:                                            "execute",
                                        client:                                            "sandbox",
                                        server:                                            "server",
                                        capability,
                                        action,
                                    },
                                },
                            );


                            await this.emit(
                                executionId,
                                {
                                    event:                                        "rpc_trace",
                                    data: {
                                        phase:                                            "response",
                                        method:                                            "execute",
                                        client:                                            "execution",
                                        server:                                            "sandbox",
                                        capability,
                                        action,
                                    },
                                },
                            );
                        }
                    },
                );

            // console.error(
            //     "[sandbox] execution transport",
            //     {
            //         constructor:
            //             executionTransport
            //                 .constructor
            //                 .name,

            //         onMessage:
            //             typeof executionTransport
            //                 .onMessage,

            //         onDisconnect:
            //             typeof executionTransport
            //                 .onDisconnect,

            //         methods:
            //             Object.getOwnPropertyNames(
            //                 Object.getPrototypeOf(
            //                     executionTransport,
            //                 ),
            //             ),
            //     },
            // );
            await executeServer.connect(executionTransport);


            const [
                stderrText,
                exitCode,
            ] =
                await Promise.all([
                    new Response(limitedStderr).text(),

                    child.exited,
                ]);


            if (timedOut) {
                await this.emit(
                    executionId,
                    {
                        event: "timeout",
                        data: {
                            timeoutMs,
                        },
                    },
                );
            }


            if (outputExceeded) {
                await this.emit(
                    executionId,
                    {
                        event: "output_exceeded",
                        data: {
                            maxOutputBytes: MAX_OUTPUT_BYTES,
                        },
                    },
                );
            }


            await this.emit(
                executionId,
                {
                    event: "exit",
                    data: {
                        exitCode,
                    },
                },
            );


            /*
             * Parent cancellation is semantically different
             * from our internal timeout/output-limit abort.
             *
             * The former cancels sandbox/run itself.
             * The latter produces a normal SandboxRunResult.
             */
            if (signal.aborted) {
                throw (
                    signal.reason ??
                    new DOMException(
                        "The operation was aborted",
                        "AbortError",
                    )
                );
            }


            const output =
                stdoutLines.length > 0
                    ? [
                        ...stdoutLines,
                    ]
                    : [];


            if (outputExceeded) {
                output.push(
                    `[TRUNCATED] Output exceeded ${MAX_OUTPUT_BYTES} bytes`,
                );
            }

            return {
                stdout:
                    output.length > 0
                        ? output.join(
                            "\n",
                        ) + "\n"
                        : "",

                stderr: stderrText,
                exitCode,
                timedOut,
            };

        } finally {

            if (timeout) {
                clearTimeout(
                    timeout,
                );
            }


            if (killProcess) {
                controller.signal
                    .removeEventListener(
                        "abort",
                        killProcess,
                    );

                // Covers failures during setup too:
                // connect(), stream validation, etc.
                killProcess();
            }


            try {
                await executeServer?.close();

            } catch (error) {
                console.error(
                    "[sandbox] failed to close execute server",
                    error,
                );
            }


            try {
                await executionTransport?.close();

            } catch (error) {
                console.error(
                    "[sandbox] failed to close execution transport",
                    error,
                );
            }


            signal.removeEventListener(
                "abort",
                onAbort,
            );


            await unlink(userFile).catch(() => { });


            /*
             * A sandbox/run RPC error is still a response
             * from the sandbox side, so keep the trace
             * balanced even when run() throws.
             */
            await this.emit(
                executionId,
                {
                    event: "rpc_trace",
                    data: {
                        phase: "response",
                        method: "sandbox/run",

                        client:
                            "server",

                        server:
                            "sandbox",
                    },
                },
            );
        }
    }
}


function limitReadableStream(
    stream:
        ReadableStream<Uint8Array>,

    reserve:
        (
            bytes:
                number,
        ) => boolean,
): ReadableStream<Uint8Array> {

    const reader =
        stream.getReader();


    return new ReadableStream<
        Uint8Array
    >({

        async pull(
            controller,
        ) {
            const {
                done,
                value,
            } =
                await reader.read();


            if (done) {
                controller.close();

                return;
            }


            if (!reserve(value.byteLength)) {
                await reader
                    .cancel()
                    .catch(() => { });

                controller.close();

                return;
            }


            controller.enqueue(value);
        },

        async cancel(reason) {
            await reader
                .cancel(reason)
                .catch(() => { });
        },
    });
}