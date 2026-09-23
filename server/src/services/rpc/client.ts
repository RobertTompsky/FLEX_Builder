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
        super(
            message,
        );

        this.name =
            "RpcError";
    }
}

export class RpcClient {
    private nextId = 1;

    private transport?:
        RpcTransport;

    private unsubscribe?:
        () => void;

    private readonly pending =
        new Map<
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

        this.transport =
            transport;

        this.unsubscribe =
            transport.subscribe(
                (message) => {
                    if (
                        isJsonRpcResponse(
                            message,
                        )
                    ) {
                        this.handleResponse(
                            message,
                        );
                    }
                },
            );

        try {
            await transport.connect();
        } catch (error) {
            this.unsubscribe?.();

            this.unsubscribe =
                undefined;

            this.transport =
                undefined;

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
        const transport =
            this.getTransport();

        const {
            signal,
        } = options;

        signal?.throwIfAborted();

        const id =
            this.nextId++;

        const result =
            new Promise<TResult>(
                (
                    resolve,
                    reject,
                ) => {
                    const onAbort =
                        () => {
                            const request =
                                this.pending.get(
                                    id,
                                );

                            if (!request) {
                                return;
                            }

                            this.pending.delete(
                                id,
                            );

                            request.cleanup();

                            void this.notify(
                                "$/cancelRequest",
                                {
                                    id,
                                },
                            ).catch(
                                () => {},
                            );

                            reject(
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
                            once: true,
                        },
                    );

                    this.pending.set(
                        id,
                        {
                            resolve(
                                value,
                            ) {
                                resolve(
                                    value as TResult,
                                );
                            },

                            reject,

                            cleanup() {
                                signal
                                    ?.removeEventListener(
                                        "abort",
                                        onAbort,
                                    );
                            },
                        },
                    );
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
            const request =
                this.pending.get(
                    id,
                );

            this.pending.delete(
                id,
            );

            request?.cleanup();

            request?.reject(
                error instanceof Error
                    ? error
                    : new Error(
                        String(
                            error,
                        ),
                    ),
            );
        }

        return result;
    }

    async notify<
        TParams = unknown,
    >(
        method: string,
        params?: TParams,
    ): Promise<void> {
        const transport =
            this.getTransport();

        await transport.send({
            jsonrpc:
                "2.0",
            method,
            params,
        });
    }

    async close():
        Promise<void> {
        this.unsubscribe?.();

        this.unsubscribe =
            undefined;

        this.transport =
            undefined;

        for (
            const request
            of this.pending.values()
        ) {
            request.cleanup();

            request.reject(
                new Error(
                    "RPC client closed",
                ),
            );
        }

        this.pending.clear();
    }

    private handleResponse(
        response: JsonRpcResponse,
    ): void {
        if (
            response.id ===
            null
        ) {
            return;
        }

        const request =
            this.pending.get(
                response.id,
            );

        if (!request) {
            return;
        }

        this.pending.delete(
            response.id,
        );

        request.cleanup();

        if (
            "error" in response
        ) {
            request.reject(
                new RpcError(
                    response.error.code,
                    response.error.message,
                    response.error.data,
                ),
            );

            return;
        }

        request.resolve(
            response.result,
        );
    }

    private getTransport():
        RpcTransport {
        if (!this.transport) {
            throw new Error(
                "RPC client is not connected",
            );
        }

        return this.transport;
    }
}