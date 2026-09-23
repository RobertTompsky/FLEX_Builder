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
    readLines,
} from "../../rpc/stdio/readLines";

import {
    EXECUTION_RPC_PREFIX,
} from "./protocol";

type ExecutionHostTransportInput = {
    stdout:
    ReadableStream<Uint8Array>;

    writeLine(
        line: string,
    ): Promise<void>;

    onStdout?(
        line: string,
    ): void | Promise<void>;
};

export class ExecutionHostTransport
    implements RpcTransport {

    private connected = false;

    private readonly handlers =
        new Set<
            MessageHandler
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

        void this.readLoop();
    }

    subscribe(
        handler: MessageHandler,
    ): () => void {
        this.handlers.add(handler);

        return () => {
            this.handlers.delete(handler);
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

        await this.input.writeLine(
            serializeMessage(message),
        );
    }

    async close():
        Promise<void> {
        this.connected = false;

        this.handlers.clear();
    }

    private async readLoop():
        Promise<void> {
        for await (const line of readLines(this.input.stdout)) {
            if (!this.connected) {
                return;
            }

            if (!line.startsWith(EXECUTION_RPC_PREFIX)) {
                await this.input.onStdout?.(line);

                continue;
            }

            const raw = line.slice(EXECUTION_RPC_PREFIX.length);

            const message = parseMessage(raw);

            for (const handler of this.handlers) {
                await handler(message);
            }
        }
    }
}