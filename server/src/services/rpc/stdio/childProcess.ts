import {
    debugRpc,
} from "../debug";

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
    TransportDisconnectHandler,
} from "../transport";

import {
    readLines,
} from "./readLines";

type ChildProcessTransportOptions = {
    command: string;
    args?: string[];
    cwd?: string;
    env?: Record<string, string | undefined>;
    stderr?: | "inherit" | "pipe";
};

export class ChildProcessTransport
    implements RpcTransport {

    private process?:
        ReturnType<
            typeof Bun.spawn
        >;

    private writeLine?: (
        line: string,
    ) => Promise<void>;

    private readTask?: Promise<void>;

    private readonly messageHandlers =
        new Set<
            MessageHandler
        >();

    private readonly disconnectHandlers =
        new Set<
            TransportDisconnectHandler
        >();

    constructor(
        private readonly options:
            ChildProcessTransportOptions,
    ) { }

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
            stderr =
            "inherit",
        } = this.options;

        const child = Bun.spawn(
            [
                command,
                ...args,
            ],
            {
                cwd,
                env,
                stdin: "pipe",
                stdout: "pipe",
                stderr,
            },
        );

        const stdin = child.stdin;

        if (
            !stdin ||
            typeof stdin ===
            "number"
        ) {
            child.kill();

            throw new Error(
                "Process stdin is not available",
            );
        }

        const stdout = child.stdout;

        if (!(stdout instanceof ReadableStream)) {
            child.kill();

            throw new Error(
                "Process stdout is not available",
            );
        }

        this.process = child;

        this.writeLine = async line => {
            stdin.write(line + "\n");

            await stdin.flush();
        };

        this.readTask = this.watch(child, stdout);
    }


    onMessage(
        handler: MessageHandler,
    ): () => void {

        this.messageHandlers.add(handler);

        return () => {
            this.messageHandlers.delete(handler);
        };
    }

    onDisconnect(
        handler: TransportDisconnectHandler,
    ): () => void {

        this.disconnectHandlers.add(handler);

        return () => {
            this.disconnectHandlers.delete(handler);
        };
    }

    async send(
        message: JsonRpcMessage,
    ): Promise<void> {

        const child = this.process;

        const writeLine = this.writeLine;

        if (!child || !writeLine) {
            throw new Error(
                "Transport is not connected",
            );
        }

        debugRpc("send", message);

        try {
            await writeLine(serializeMessage(message));
        } catch (error) {

            const cause = toError(error);

            this.disconnect(child, cause);

            throw cause;
        }
    }

    async close(): Promise<void> {

        const child = this.process;

        if (!child) {
            return;
        }

        this.process = undefined;

        this.writeLine = undefined;

        if (child.exitCode === null) {
            child.kill();
        }

        await Promise.allSettled([
            child.exited,
            this.readTask,
        ]);

        this.readTask = undefined;

        this.messageHandlers.clear();
        this.disconnectHandlers.clear();
    }

    private async watch(
        child: ReturnType<typeof Bun.spawn>,
        stdout: ReadableStream<Uint8Array>,
    ): Promise<void> {
        try {
            await this.readLoop(stdout);

            const exitCode = await child.exited;

            this.disconnect(
                child,
                new Error(
                    `RPC child process exited with code ${exitCode}`,
                ),
            );

        } catch (error) {
            this.disconnect(child, toError(error));
        }
    }

    private async readLoop(
        stdout: ReadableStream<Uint8Array>,
    ): Promise<void> {

        for await (const line of readLines(stdout)) {
            const message = parseMessage(line);

            debugRpc("receive", message);

            for (const handler of this.messageHandlers) {
                await handler(
                    message,
                );
            }
        }
    }

    private disconnect(
        child: ReturnType<typeof Bun.spawn>,
        error: Error,
    ): void {

        if (this.process !== child) {
            return;
        }

        this.process = undefined;

        this.writeLine = undefined;

        if (child.exitCode === null) {
            child.kill();
        }

        const handlers = [
            ...this.disconnectHandlers,
        ];

        this.messageHandlers.clear();
        this.disconnectHandlers.clear();

        for (const handler of handlers) {
            handler(error);
        }
    }
}

function toError(
    error: unknown,
): Error {
    return error instanceof Error
        ? error
        : new Error(String(error));
}