import {
    parseMessage,
    serializeMessage,
} from "../../rpc/protocol";

import type {
    JsonRpcMessage,
} from "../../rpc/protocol";

import type {
    MessageHandler,
    RpcTransport,
    TransportDisconnectHandler,
} from "../../rpc/transport";

import {
    EXECUTION_RPC_PREFIX,
} from "./protocol";


export class ExecutionStdioTransport
    implements RpcTransport {

    private connected = false;

    private reader?:
        ReadableStreamDefaultReader<
            Uint8Array
        >;

    private writeQueue:
        Promise<void> =
        Promise.resolve();

    private readTask?: Promise<void>;

    private readonly messageHandlers =
        new Set<
            MessageHandler
        >();

    private readonly disconnectHandlers =
        new Set<
            TransportDisconnectHandler
        >();

    async connect(): Promise<void> {

        if (this.connected) {
            return;
        }

        this.connected = true;

        this.reader = Bun.stdin
            .stream()
            .getReader();

        this.readTask = this.watch();
    }


    onMessage(handler: MessageHandler): () => void {

        this.messageHandlers.add(handler);

        return () => {
            this.messageHandlers.delete(handler);
        };
    }


    onDisconnect(handler: TransportDisconnectHandler): () => void {

        this.disconnectHandlers.add(handler);

        return () => {
            this.disconnectHandlers.delete(handler);
        };
    }


    async send(message: JsonRpcMessage): Promise<void> {

        if (!this.connected) {
            throw new Error(
                "Execution transport is not connected",
            );
        }

        const line = EXECUTION_RPC_PREFIX + serializeMessage(message) + "\n";

        this.writeQueue = this.writeQueue.then(
            () =>
                new Promise<void>(
                    (
                        resolve,
                        reject,
                    ) => {
                        process.stdout.write(
                            line,
                            error => {
                                if (error) {
                                    reject(
                                        error,
                                    );

                                    return;
                                }

                                resolve();
                            },
                        );
                    },
                ),
        );

        try {
            await this.writeQueue;

        } catch (error) {

            const cause = toError(error);

            this.disconnect(cause);

            throw cause;
        }
    }


    async close():
        Promise<void> {

        if (!this.connected) {
            return;
        }

        this.connected = false;


        await this.reader?.cancel().catch(() => { });

        await Promise.allSettled([
            this.writeQueue,
            this.readTask,
        ]);

        this.reader = undefined;

        this.readTask = undefined;

        this.messageHandlers.clear();
        this.disconnectHandlers.clear();
    }

    private async watch():
        Promise<void> {

        try {
            await this.readLoop();

            if (this.connected) {
                this.disconnect(
                    new Error(
                        "Execution stdio disconnected",
                    ),
                );
            }

        } catch (error) {

            this.disconnect(toError(error));
        }
    }


    private async readLoop():
        Promise<void> {

        const reader = this.reader;

        if (!reader) {
            return;
        }

        const decoder = new TextDecoder();

        let buffer = "";

        while (this.connected) {
            const {
                value,
                done,
            } = await reader.read();

            if (done) {
                return;
            }

            buffer += decoder.decode(
                value,
                {
                    stream:
                        true,
                },
            );

            while (true) {
                const index = buffer.indexOf("\n");

                if (index === -1) {
                    break;
                }

                const line = buffer
                    .slice(0, index)
                    .trim();

                buffer = buffer.slice(index + 1);

                if (!line) {
                    continue;
                }

                const message = parseMessage(line);

                for (const handler of this.messageHandlers) {
                    await handler(message);
                }
            }
        }
    }


    private disconnect(
        error: Error,
    ): void {

        if (!this.connected) {
            return;
        }

        this.connected = false;

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


function toError(error: unknown): Error {
    return error instanceof Error
        ? error
        : new Error(String(error));
}