import type {
    JsonRpcMessage,
} from "./protocol";

export type MessageHandler = (
    message: JsonRpcMessage,
) => void | Promise<void>;

export type TransportDisconnectHandler = (
    error: Error,
) => void;

export interface RpcTransport {
    connect(): Promise<void>;

    onMessage(
        handler: MessageHandler,
    ): () => void;

    onDisconnect(
        handler: TransportDisconnectHandler,
    ): () => void;

    send(
        message: JsonRpcMessage,
    ): Promise<void>;

    close(): Promise<void>;
}