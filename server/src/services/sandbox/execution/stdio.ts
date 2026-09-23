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
} from "../../rpc/transport";

import {
    EXECUTION_RPC_PREFIX,
} from "./protocol";

export class ExecutionStdioTransport
    implements RpcTransport {

    private connected = false;

    private readonly handlers = new Set<MessageHandler>();

    private reader?: ReadableStreamDefaultReader<Uint8Array>;

    private writeQueue: Promise<void> = Promise.resolve();

    async connect():
        Promise<void> {
        if (this.connected) {
            return;
        }

        this.connected =
            true;

        this.reader =
            Bun.stdin
                .stream()
                .getReader();

        void this.readLoop();
    }

    subscribe(handler: MessageHandler): () => void {
        this.handlers.add(handler);

        return () => this.handlers.delete(handler)
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
                                    reject(error);

                                    return;
                                }

                                resolve();
                            },
                        );
                    },
                ),
        );

        await this.writeQueue;
    }

    async close():
        Promise<void> {
        if (!this.connected) {
            return;
        }

        this.connected = false;

        await this.writeQueue;

        await this.reader
            ?.cancel()
            .catch(
                () => { },
            );

        this.reader = undefined;

        this.handlers.clear();
    }

    private async readLoop():
        Promise<void> {
        const reader = this.reader;

        if (!reader) {
            return;
        }

        const decoder = new TextDecoder();

        let buffer = "";

        try {
            while (this.connected) {
                const {
                    value,
                    done,
                } =
                    await reader.read();

                if (done) {
                    return;
                }

                buffer += decoder.decode(
                    value,
                    {
                        stream: true,
                    },
                );

                while (true) {
                    const index = buffer.indexOf("\n");

                    if (index === -1) {
                        break;
                    }

                    const line = buffer
                        .slice(
                            0,
                            index,
                        )
                        .trim();

                    buffer = buffer.slice(index + 1);

                    if (!line) {
                        continue;
                    }

                    const message = parseMessage(line);

                    for (const handler of this.handlers) {
                        await handler(
                            message,
                        );
                    }
                }
            }
        } catch (error) {
            if (this.connected) {
                throw error;
            }
        }
    }
}