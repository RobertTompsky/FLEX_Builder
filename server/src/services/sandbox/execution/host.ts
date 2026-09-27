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
    readLines,
} from "../../rpc/stdio/readLines";

import {
    EXECUTION_RPC_PREFIX,
} from "./protocol";

import {
    debugRpc,
} from "../../rpc/debug";


type ExecutionHostTransportInput = {
    stdout: ReadableStream<Uint8Array>;
    writeLine(line: string): Promise<void>;
    onStdout?(line: string):
        | void
        | Promise<void>;
};

export class ExecutionHostTransport
    implements RpcTransport {

    private connected = false;

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
        private readonly input:
            ExecutionHostTransportInput,
    ) { }


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


    async send(
        message: JsonRpcMessage,
    ): Promise<void> {

        if (!this.connected) {
            throw new Error(
                "Execution transport is not connected",
            );
        }


        debugRpc("send", message);


        try {
            await this.input.writeLine(serializeMessage(message));
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


        await Promise.allSettled([
            this.readTask,
        ]);

        this.readTask = undefined;

        this.messageHandlers.clear();
        this.disconnectHandlers.clear();
    }


    private async watch(): Promise<void> {

        try {
            await this.readLoop();

            if (this.connected) {
                this.disconnect(
                    new Error(
                        "Execution process stdout closed",
                    ),
                );
            }

        } catch (error) {
            this.disconnect(toError(error));
        }
    }


    private async readLoop(): Promise<void> {

        for await (
            const line
            of readLines(
                this.input.stdout,
            )
        ) {
            if (!this.connected) {
                return;
            }

            if (!line.startsWith(EXECUTION_RPC_PREFIX)
            ) {
                await this.input
                    .onStdout?.(line);

                continue;
            }

            const raw = line.slice(EXECUTION_RPC_PREFIX.length);

            const message = parseMessage(raw);

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