import type {
    JsonRpcMessage,
} from "./protocol";

export type MessageHandler = (
    message: JsonRpcMessage,
) => void | Promise<void>;

export interface RpcTransport {
    connect(): Promise<void>;

    subscribe(
        handler: MessageHandler,
    ): () => void;

    send(
        message: JsonRpcMessage,
    ): Promise<void>;

    close(): Promise<void>;
}