import type {
    JsonRpcMessage,
} from "../../../rpc/protocol";

import type {
    MessageHandler,
    RpcTransport,
    TransportDisconnectHandler,
} from "../../../rpc/transport";


export class ExecutionIpcTransport
    implements RpcTransport {

    private connected =
        false;


    private readonly messageHandlers =
        new Set<
            MessageHandler
        >();


    private readonly disconnectHandlers =
        new Set<
            TransportDisconnectHandler
        >();


    private readonly handleProcessMessage =
        (
            message: unknown,
        ) => {

            if (!this.connected) {
                return;
            }

            const rpcMessage = message as JsonRpcMessage;

            for (const handler of this.messageHandlers) {
                void handler(rpcMessage);
            }
        };

    private readonly handleProcessDisconnect = () => {
        this.disconnect(
            new Error(
                "Execution IPC disconnected",
            ),
        );
    };


    async connect():
        Promise<void> {

        if (this.connected) {
            return;
        }
        // console.error(
        //     "[ipc child] CONNECT",
        //     {
        //         hasSend:
        //             typeof process.send ===
        //             "function",
        //     },
        // );

        if (typeof process.send !== "function") {
            throw new Error(
                "Execution IPC is not available",
            );
        }

        this.connected = true;

        process.on(
            "message",
            this.handleProcessMessage,
        );

        process.on(
            "disconnect",
            this.handleProcessDisconnect,
        );
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

        //     console.error(
        //         "[ipc child] SEND",
        //         message,
        //     );

        //         console.error(
        //     "[ipc child] connected:",
        //     process.connected,
        // );

        if (!this.connected) {
            throw new Error(
                "Execution IPC transport is not connected",
            );
        }

        if (typeof process.send !== "function") {
            throw new Error(
                "Execution IPC is not available",
            );
        }

        process.send(message);
    }


    async close():
        Promise<void> {

        if (!this.connected) {
            return;
        }

        this.connected = false;

        process.off(
            "message",
            this.handleProcessMessage,
        );


        process.off(
            "disconnect",
            this.handleProcessDisconnect,
        );

        this.messageHandlers.clear();
        this.disconnectHandlers.clear();
    }


    private disconnect(
        error:
            Error,
    ): void {

        if (!this.connected) {
            return;
        }

        this.connected = false;

        process.off(
            "message",
            this.handleProcessMessage,
        );

        process.off(
            "disconnect",
            this.handleProcessDisconnect,
        );

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