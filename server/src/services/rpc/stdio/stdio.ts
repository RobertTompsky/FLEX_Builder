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

export class StdioTransport
    implements RpcTransport {

    private connected =
        false;

    private readTask?:
        Promise<void>;

    private writeQueue:
        Promise<void> =
            Promise.resolve();

    private readonly handlers =
        new Set<
            MessageHandler
        >();

    async connect():
        Promise<void> {
        if (this.connected) {
            return;
        }

        this.connected =
            true;

        this.readTask =
            this.readLoop();
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
        if (!this.connected) {
            throw new Error(
                "Transport is not connected",
            );
        }

        const line =
            serializeMessage(
                message,
            ) + "\n";

        this.writeQueue =
            this.writeQueue.then(
                () =>
                    new Promise<void>(
                        (
                            resolve,
                            reject,
                        ) => {
                            process.stdout.write(
                                line,
                                (
                                    error,
                                ) => {
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

        await this.writeQueue;
    }

    async close():
        Promise<void> {
        if (!this.connected) {
            return;
        }

        this.connected =
            false;

        await Promise.allSettled([
            this.writeQueue,
        ]);

        this.handlers.clear();
    }

    private async readLoop():
        Promise<void> {
        for await (
            const line
            of readLines(
                Bun.stdin.stream(),
            )
        ) {
            if (!this.connected) {
                return;
            }

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