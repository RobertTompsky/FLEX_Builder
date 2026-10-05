import type {
    JsonRpcMessage,
} from "../../../rpc/protocol";

import type {
    MessageHandler,
    RpcTransport,
    TransportDisconnectHandler,
} from "../../../rpc/transport";


type BunChildProcess = {
    send(message: unknown): void;
};

export class HostIpcTransport
    implements RpcTransport {

    private connected = false;

    private readonly messageHandlers =
        new Set<
            MessageHandler
        >();

    private readonly disconnectHandlers =
        new Set<
            TransportDisconnectHandler
        >();

    private readonly inbox: JsonRpcMessage[] = [];

    constructor(
        private readonly child:
            BunChildProcess,
    ) { }

    async connect(): Promise<void> {

        if (this.connected) {
            return;
        }

        this.connected = true;
    }

    onMessage(
        handler: MessageHandler,
    ): () => void {

        this.messageHandlers.add(handler);


        if (this.connected && this.inbox.length > 0) {
            const messages = this.inbox.splice(0,);

            for (const message of messages) {
                this.dispatch(message);
            }
        }

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
        message:
            JsonRpcMessage,
    ): Promise<void> {

        if (!this.connected) {
            throw new Error(
                "Execution IPC transport is not connected",
            );
        }

        try {
            this.child.send(message);

        } catch (error) {
            const cause = toError(error);

            this.disconnect(cause);

            throw cause;
        }
    }

    private dispatch(
        message: JsonRpcMessage,
    ): void {
        for (const handler of this.messageHandlers) {
            void handler(message);
        }
    }

    receive(
        message: unknown,
    ): void {

        // console.error(
        //     "[ipc transport] RECEIVE",
        //     {
        //         connected:                    this.connected,
        //         handlers:                    this.messageHandlers.size,
        //         message,
        //     },
        // );

        const rpcMessage = message as JsonRpcMessage;

        if (
            !this.connected ||
            this.messageHandlers.size === 0
        ) {
            this.inbox.push(rpcMessage);

            return;
        }

        this.dispatch(rpcMessage);
    }


    disconnected():
        void {

        this.disconnect(
            new Error(
                "Execution IPC disconnected",
            ),
        );
    }


    async close():
        Promise<void> {

        if (!this.connected) {
            return;
        }

        this.connected = false;

        this.inbox.length = 0;

        this.messageHandlers.clear();
        this.disconnectHandlers.clear();
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
        : new Error(
            String(
                error,
            ),
        );
}