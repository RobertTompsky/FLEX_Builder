import {
    isJsonRpcResponse,
} from "./protocol";

import type {
    JsonRpcId,
    JsonRpcResponse,
} from "./protocol";

import type {
    RpcTransport,
} from "./transport";

export type RpcCallOptions = {
    signal?: AbortSignal;
};

type PendingRequest = {
    resolve(
        value: unknown,
    ): void;

    reject(
        error: Error,
    ): void;

    cleanup(): void;
};


export class RpcError
    extends Error {

    constructor(
        public readonly code: number,

        message: string,

        public readonly data?: unknown,
    ) {
        super(message);

        this.name = "RpcError";
    }
}


export class RpcClient {

    private nextId = 1;

    private transport?: RpcTransport;

    private unsubscribeMessage?: () => void;

    private unsubscribeDisconnect?: () => void;

    private readonly pending = new Map<
        JsonRpcId,
        PendingRequest
    >();


    async connect(
        transport: RpcTransport,
    ): Promise<void> {

        if (this.transport) {
            throw new Error(
                "RPC client is already connected",
            );
        }

        this.transport = transport;


        this.unsubscribeMessage = transport.onMessage(
            message => {
                if (isJsonRpcResponse(message)
                ) {
                    this.handleResponse(message);
                }
            },
        );

        this.unsubscribeDisconnect = transport.onDisconnect(
            error => {
                this.handleDisconnect(error);
            },
        );

        try {
            await transport.connect();
        } catch (error) {
            this.unsubscribe();

            this.transport = undefined;

            throw error;
        }
    }


    async call<
        TResult = unknown,
        TParams = unknown,
    >(
        method: string,
        params?: TParams,
        options: RpcCallOptions = {},
    ): Promise<TResult> {

        const transport = this.getTransport();

        const {
            signal,
        } = options;

        signal?.throwIfAborted();

        const id = this.nextId++;

        let onAbort: (() => void) | undefined;

        const result = new Promise<TResult>(
            (
                resolve,
                reject,
            ) => {

                const cleanup =
                    () => {
                        if (onAbort) {
                            signal
                                ?.removeEventListener(
                                    "abort",
                                    onAbort,
                                );
                        }
                    };

                this.pending.set(
                    id,
                    {
                        resolve(value) {
                            resolve(value as TResult);
                        },

                        reject,

                        cleanup,
                    },
                );

                onAbort = () => {
                    const request = this.pending.get(id);

                    if (!request) {
                        return;
                    }

                    this.pending.delete(id);

                    request.cleanup();

                    void this.notify(
                        "$/cancelRequest",
                        {
                            id,
                        },
                    ).catch(
                        () => { },
                    );

                    request.reject(
                        signal?.reason
                            instanceof Error

                            ? signal.reason

                            : new DOMException(
                                "The operation was aborted",
                                "AbortError",
                            ),
                    );
                };

                signal?.addEventListener(
                    "abort",
                    onAbort,
                    {
                        once:
                            true,
                    },
                );

                // Covers the race between
                // throwIfAborted() and addEventListener().
                if (signal?.aborted) {
                    onAbort();
                }
            },
        );

        try {
            await transport.send({
                jsonrpc:
                    "2.0",

                id,
                method,
                params,
            });

        } catch (error) {

            const request = this.pending.get(id);

            if (request) {
                this.pending.delete(id);

                request.cleanup();

                request.reject(toError(error));
            }
        }

        return result;
    }


    async notify<
        TParams = unknown,
    >(
        method: string,
        params?: TParams,
    ): Promise<void> {
        const transport = this.getTransport();

        await transport.send({
            jsonrpc: "2.0",
            method,
            params,
        });
    }

    async close(): Promise<void> {

        this.unsubscribe();

        this.transport = undefined;

        this.rejectPending(
            new Error(
                "RPC client closed",
            ),
        );
    }


    private handleDisconnect(
        error: Error,
    ): void {

        this.unsubscribe();

        this.transport = undefined;

        this.rejectPending(error);
    }


    private handleResponse(
        response: JsonRpcResponse,
    ): void {
        if (response.id === null) {
            return;
        }

        const request = this.pending.get(response.id);

        if (!request) {
            return;
        }

        this.pending.delete(response.id);

        request.cleanup();


        if ("error" in response) {
            request.reject(
                new RpcError(
                    response.error.code,
                    response.error.message,
                    response.error.data,
                ),
            );

            return;
        }

        request.resolve(response.result);
    }

    private rejectPending(
        error: Error,
    ): void {

        for (
            const request
            of this.pending.values()
        ) {
            request.cleanup();

            request.reject(
                error,
            );
        }

        this.pending.clear();
    }


    private unsubscribe():
        void {

        this.unsubscribeMessage?.();
        this.unsubscribeDisconnect?.();

        this.unsubscribeMessage = undefined;

        this.unsubscribeDisconnect = undefined;
    }


    private getTransport(): RpcTransport {

        if (!this.transport) {
            throw new Error(
                "RPC client is not connected",
            );
        }

        return this.transport;
    }
}

function toError(
    error: unknown,
): Error {

    return error instanceof Error
        ? error
        : new Error(String(error));
}