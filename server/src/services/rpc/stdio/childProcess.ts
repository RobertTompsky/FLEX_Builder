import {
    parseMessage,
    serializeMessage,
} from "../protocol";

import type {
    JsonRpcMessage,
} from "../protocol";

import type {
    MessageHandler,
    RpcTransport,
} from "../transport";

import {
    readLines,
} from "./readLines";

export type ChildProcessTransportOptions = {
    command: string;

    args?: string[];

    cwd?: string;

    env?: Record<
        string,
        string | undefined
    >;

    stderr?:
        | "inherit"
        | "pipe";
};

export class ChildProcessTransport
    implements RpcTransport {

    private process?: ReturnType<
        typeof Bun.spawn
    >;

    private writeLine?: (
        line: string,
    ) => Promise<void>;

    private readTask?:
        Promise<void>;

    private readonly handlers =
        new Set<
            MessageHandler
        >();

    constructor(
        private readonly options:
            ChildProcessTransportOptions,
    ) {}

    async connect():
        Promise<void> {
        if (this.process) {
            return;
        }

        const {
            command,
            args = [],
            cwd,
            env,
            stderr = "inherit",
        } = this.options;

        const process =
            Bun.spawn(
                [
                    command,
                    ...args,
                ],
                {
                    cwd,
                    env,

                    stdin:
                        "pipe",

                    stdout:
                        "pipe",

                    stderr,
                },
            );

        const stdin =
            process.stdin;

        if (
            !stdin ||
            typeof stdin ===
                "number"
        ) {
            process.kill();

            throw new Error(
                "Process stdin is not available",
            );
        }

        const stdout =
            process.stdout;

        if (
            !(
                stdout
                instanceof
                    ReadableStream
            )
        ) {
            process.kill();

            throw new Error(
                "Process stdout is not available",
            );
        }

        this.process =
            process;

        this.writeLine =
            async (
                line,
            ) => {
                stdin.write(
                    line + "\n",
                );

                await stdin.flush();
            };

        this.readTask =
            this.readLoop(
                stdout,
            );
    }

    subscribe(
        handler: MessageHandler,
    ): () => void {
        this.handlers.add(
            handler,
        );

        return () => {
            this.handlers.delete(
                handler,
            );
        };
    }

    async send(
        message: JsonRpcMessage,
    ): Promise<void> {
        const writeLine =
            this.writeLine;

        if (!writeLine) {
            throw new Error(
                "Transport is not connected",
            );
        }

        await writeLine(
            serializeMessage(
                message,
            ),
        );
    }

    async close():
        Promise<void> {
        const process =
            this.process;

        if (!process) {
            return;
        }

        this.process =
            undefined;

        this.writeLine =
            undefined;

        if (
            process.exitCode ===
            null
        ) {
            process.kill();
        }

        await Promise.allSettled([
            process.exited,
            this.readTask,
        ]);

        this.readTask =
            undefined;

        this.handlers.clear();
    }

    private async readLoop(
        stdout:
            ReadableStream<
                Uint8Array
            >,
    ): Promise<void> {
        for await (
            const line
            of readLines(
                stdout,
            )
        ) {
            const message =
                parseMessage(
                    line,
                );

            for (
                const handler
                of this.handlers
            ) {
                await handler(
                    message,
                );
            }
        }
    }
}