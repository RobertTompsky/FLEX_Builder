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

import type {
    ExecutionEvent,
} from "@flex-builder/shared/sandbox";

import {
    createExecutionEnv,
} from "./execution/env";

import {
    validateCode,
} from "./execution/validateCode";

import {
    RpcRelay,
} from "../rpc/relay";

import type {
    RpcRelayAttachment,
} from "../rpc/relay";

import type {
    ExecutionHost,
} from "./execution/host";

import type {
    ExecutionProcess,
} from "./execution/process";


const DEFAULT_TIMEOUT_MS =
    10_000;

const MAX_OUTPUT_BYTES =
    1_000_000;


type SandboxRuntimeDeps = {
    executionHost:
    ExecutionHost;

    relay:
    RpcRelay;

    emitExecutionEvent: (
        executionId:
            string,

        event:
            ExecutionEvent,
    ) =>
        | void
        | Promise<void>;
};


export class SandboxRuntime {

    constructor(
        private readonly deps:
            SandboxRuntimeDeps,
    ) { }


    private async emit(
        executionId:
            string,

        event:
            ExecutionEvent,
    ): Promise<void> {

        try {
            await this.deps
                .emitExecutionEvent(
                    executionId,
                    event,
                );

        } catch (error) {
            console.error(
                "[sandbox:event]",
                error,
            );
        }
    }


    async run(
        input:
            SandboxRunInput,

        signal:
            AbortSignal,
    ): Promise<
        SandboxRunResult
    > {

        signal.throwIfAborted();


        const {
            executionId,
            code,

            cwd:
            inputCwd,

            timeoutMs:
            inputTimeoutMs,
        } = input;


        const validationError =
            validateCode(
                code,
            );


        if (
            validationError
        ) {
            await this.emit(
                executionId,
                {
                    event:
                        "rpc_trace",

                    data: {
                        phase:
                            "response",

                        method:
                            "sandbox/run",

                        client:
                            "server",

                        server:
                            "sandbox",
                    },
                },
            );


            return {
                stdout:
                    `[BLOCKED] ${validationError}`,

                stderr:
                    "",

                exitCode:
                    0,

                timedOut:
                    false,
            };
        }


        const cwd =
            inputCwd ??
            process.cwd();


        const timeoutMs =
            inputTimeoutMs ??
            DEFAULT_TIMEOUT_MS;


        const userFile =
            path.join(
                cwd,
                `.sandbox-${randomUUID()}.ts`,
            );


        const controller =
            new AbortController();


        let timedOut =
            false;

        let outputExceeded =
            false;

        let outputBytes =
            0;


        const onAbort =
            () => {
                if (
                    controller.signal
                        .aborted
                ) {
                    return;
                }


                controller.abort(
                    signal.reason,
                );
            };


        signal.addEventListener(
            "abort",
            onAbort,
            {
                once:
                    true,
            },
        );


        /*
         * Covers the small race between
         * throwIfAborted() and addEventListener().
         */
        if (
            signal.aborted
        ) {
            onAbort();
        }


        let timeout:
            ReturnType<
                typeof setTimeout
            >
            | undefined;


        let execution:
            ExecutionProcess
            | undefined;


        let relayAttachment:
            RpcRelayAttachment
            | undefined;


        const killExecution =
            () => {
                execution?.kill();
            };


        const reserveOutput = (
            bytes:
                number,
        ): boolean => {

            if (
                controller.signal
                    .aborted
            ) {
                return false;
            }


            if (
                outputBytes +
                bytes <=
                MAX_OUTPUT_BYTES
            ) {
                outputBytes +=
                    bytes;

                return true;
            }


            outputExceeded =
                true;


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

            execution = await this.deps
                .executionHost
                .spawn({
                    executionId,
                    entryFile,
                    userFile,
                    cwd,
                    env: createExecutionEnv(),
                });

            /*
             * Internal aborts — timeout / output limit /
             * parent cancellation forwarded above —
             * terminate the execution process.
             */
            controller.signal.addEventListener(
                "abort",
                killExecution,
                {
                    once:
                        true,
                },
            );


            /*
             * Covers abort happening while
             * executionHost.spawn() was running.
             */
            if (controller.signal.aborted) {
                killExecution();
            }

            timeout = setTimeout(
                () => {
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
                        pid: execution.pid,
                    },
                },
            );
            /*
             * The execution RPC transport is exposed
             * by ExecutionProcess.
             *
             * SandboxRuntime no longer knows how that
             * transport is physically implemented.
             */
            relayAttachment = await this.deps
                .relay
                .attach(
                    executionId,
                    execution.rpc,
                );


            /*
             * stderr is still a dedicated physical stream,
             * so it can be limited directly.
             */
            const limitedStdout = limitReadableStream(
                execution.stdout,
                reserveOutput,
            );

            const limitedStderr = limitReadableStream(
                execution.stderr,
                reserveOutput,
            );


            const [
                stdoutText,
                stderrText,
                exitCode,
            ] =
                await Promise.all([
                    new Response(limitedStdout).text(),
                    new Response(limitedStderr).text(),
                    execution.exited,
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
             * Parent cancellation is semantically
             * different from internal timeout /
             * output-limit abort.
             *
             * Parent cancellation cancels
             * sandbox/run itself.
             *
             * Internal abort produces a normal
             * SandboxRunResult.
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

            let stdout = stdoutText;

            if (outputExceeded) {
                if (
                    stdout.length > 0 &&
                    !stdout.endsWith(
                        "\n",
                    )
                ) {
                    stdout += "\n";
                }

                stdout += `[TRUNCATED] Output exceeded ${MAX_OUTPUT_BYTES} bytes\n`;
            }


            return {
                stdout,
                stderr: stderrText,
                exitCode,
                timedOut,
            };

        } finally {

            if (timeout) {
                clearTimeout(timeout);
            }

            /*
             * Ensure the execution process is terminated
             * before releasing its relay attachment.
             */
            if (execution) {
                controller.signal.removeEventListener(
                    "abort",
                    killExecution,
                );

                execution.kill();
            }


            if (relayAttachment) {
                try {
                    await relayAttachment.close();

                } catch (error) {
                    console.error(
                        "[sandbox] failed to detach execution",
                        error,
                    );
                }
            }

            signal.removeEventListener(
                "abort",
                onAbort,
            );

            await unlink(userFile).catch(() => { });
            /*
             * A sandbox/run RPC error is still
             * a response from the sandbox side,
             * so keep the trace balanced.
             */
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
        }
    }
}


function limitReadableStream(
    stream: ReadableStream<Uint8Array>,

    reserve: (bytes: number,) => boolean): ReadableStream<Uint8Array> {

    const reader = stream.getReader();

    return new ReadableStream<
        Uint8Array
    >({
        async pull(controller) {
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
                    .catch(
                        () => { },
                    );

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