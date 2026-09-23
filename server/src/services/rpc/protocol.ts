export type JsonRpcId =
    string | number;

export type JsonRpcRequest<
    TParams = unknown,
    TMethod extends string = string,
> = {
    jsonrpc: "2.0";
    id: JsonRpcId;
    method: TMethod;
    params?: TParams;
};

export type JsonRpcNotification<
    TParams = unknown,
    TMethod extends string = string,
> = {
    jsonrpc: "2.0";
    method: TMethod;
    params?: TParams;
};

export type JsonRpcSuccess<
    TResult = unknown,
> = {
    jsonrpc: "2.0";
    id: JsonRpcId;
    result: TResult;
};

export type JsonRpcFailure = {
    jsonrpc: "2.0";
    id: JsonRpcId | null;
    error: {
        code: number;
        message: string;
        data?: unknown;
    };
};

export type JsonRpcResponse<
    TResult = unknown,
> =
    | JsonRpcSuccess<TResult>
    | JsonRpcFailure;

export type JsonRpcMessage =
    | JsonRpcRequest
    | JsonRpcNotification
    | JsonRpcResponse;

export const JsonRpcErrorCode = {
    parseError: -32700,
    invalidRequest: -32600,
    methodNotFound: -32601,
    invalidParams: -32602,
    internalError: -32603,
} as const;

export function isJsonRpcRequest(
    message: JsonRpcMessage,
): message is JsonRpcRequest {
    return (
        "method" in message &&
        "id" in message
    );
}

export function isJsonRpcNotification(
    message: JsonRpcMessage,
): message is JsonRpcNotification {
    return (
        "method" in message &&
        !("id" in message)
    );
}

export function isJsonRpcResponse(
    message: JsonRpcMessage,
): message is JsonRpcResponse {
    return (
        "id" in message &&
        (
            "result" in message ||
            "error" in message
        )
    );
}

export function serializeMessage(
    message: JsonRpcMessage,
): string {
    return JSON.stringify(
        message,
    );
}

export function parseMessage(
    line: string,
): JsonRpcMessage {
    return JSON.parse(
        line,
    ) as JsonRpcMessage;
}