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


export class StdioTransport
    implements RpcTransport {

    private connected = false;

    private readTask?: Promise<void>;

    private writeQueue: Promise<void> = Promise.resolve();

    private readonly messageHandlers =
        new Set<
            MessageHandler
        >();

    private readonly disconnectHandlers =
        new Set<
            TransportDisconnectHandler
        >();


    async connect():
        Promise<void> {

        if (this.connected) {
            return;
        }

        this.connected = true;

        this.readTask = this.watch();
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


    async send(message: JsonRpcMessage): Promise<void> {

        if (!this.connected) {
            throw new Error(
                "Transport is not connected",
            );
        }

        debugRpc("send", message);

        const line = serializeMessage(message,) + "\n";

        this.writeQueue = this.writeQueue.then(
            () => new Promise<void>(
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

        try {
            await this.writeQueue;
        } catch (error) {
            const cause = toError(error);

            this.disconnect(cause);

            throw cause;
        }
    }


    async close(): Promise<void> {

        if (!this.connected) {
            return;
        }

        this.connected = false;

        await Promise.allSettled([
            this.writeQueue,
            this.readTask,
        ]);

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
                        "RPC stdio disconnected",
                    ),
                );
            }

        } catch (error) {

            this.disconnect(
                toError(error),
            );
        }
    }


    private async readLoop():
        Promise<void> {

        for await (const line of readLines(Bun.stdin.stream())) {
            if (!this.connected) {
                return;
            }


            const message = parseMessage(line);


            debugRpc("receive", message);


            for (const handler of this.messageHandlers) {
                await handler(message);
            }
        }
    }


    private disconnect(error: Error): void {

        if (!this.connected) {
            return;
        }


        this.connected = false;


        const handlers =
            [
                ...this.disconnectHandlers,
            ];


        this.messageHandlers.clear();
        this.disconnectHandlers.clear();


        for (const handler of handlers) {
            handler(error);
        }
    }
}


function toError(error: unknown,): Error {

    return error instanceof Error
        ? error
        : new Error(
            String(
                error,
            ),
        );
}