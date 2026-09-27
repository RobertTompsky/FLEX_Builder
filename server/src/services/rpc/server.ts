import {
    isJsonRpcNotification,
    isJsonRpcRequest,
    JsonRpcErrorCode,
} from "./protocol";

import type {
    JsonRpcId,
    JsonRpcNotification,
    JsonRpcRequest,
} from "./protocol";

import type {
    RpcTransport,
} from "./transport";

export type RpcHandler<
    TParams = unknown,
    TResult = unknown,
> = (
    params: TParams,
    signal: AbortSignal,
) =>
        | TResult
        | Promise<TResult>;

type AnyRpcHandler =
    RpcHandler<
        any,
        any
    >;

export class RpcServer {
    private transport?:
        RpcTransport;

    private unsubscribeMessage?:
        () => void;

    private unsubscribeDisconnect?:
        () => void;

    private handleDisconnect(
        error:
            Error,
    ): void {

        this.unsubscribe();

        this.transport =
            undefined;

        this.abortActive(
            error,
        );
    }


    private abortActive(
        reason:
            Error,
    ): void {

        for (
            const controller
            of this.active.values()
        ) {
            controller.abort(
                reason,
            );
        }

        this.active.clear();
    }


    private unsubscribe():
        void {

        this.unsubscribeMessage?.();
        this.unsubscribeDisconnect?.();

        this.unsubscribeMessage =
            undefined;

        this.unsubscribeDisconnect =
            undefined;
    }

    private readonly handlers =
        new Map<
            string,
            AnyRpcHandler
        >();

    private readonly active =
        new Map<
            JsonRpcId,
            AbortController
        >();

    register<
        TParams = unknown,
        TResult = unknown,
    >(
        method: string,
        handler:
            RpcHandler<
                TParams,
                TResult
            >,
    ): this {
        if (
            this.handlers.has(
                method,
            )
        ) {
            throw new Error(
                `RPC method already registered: ${method}`,
            );
        }

        this.handlers.set(
            method,
            handler,
        );

        return this;
    }

    async connect(
        transport:
            RpcTransport,
    ): Promise<void> {

        if (this.transport) {
            throw new Error(
                "RPC server is already connected",
            );
        }


        this.transport =
            transport;


        this.unsubscribeMessage =
            transport.onMessage(
                message => {

                    if (
                        isJsonRpcRequest(
                            message,
                        )
                    ) {
                        void this.handleRequest(
                            message,
                        );

                        return;
                    }


                    if (
                        isJsonRpcNotification(
                            message,
                        )
                    ) {
                        this.handleNotification(
                            message,
                        );
                    }
                },
            );


        this.unsubscribeDisconnect =
            transport.onDisconnect(
                error => {
                    this.handleDisconnect(
                        error,
                    );
                },
            );


        try {
            await transport.connect();

        } catch (error) {

            this.unsubscribe();

            this.transport =
                undefined;

            throw error;
        }
    }

    async close():
        Promise<void> {

        this.unsubscribe();

        this.transport =
            undefined;

        this.abortActive(
            new Error(
                "RPC server closed",
            ),
        );
    }

    private async handleRequest(
        request: JsonRpcRequest,
    ): Promise<void> {
        const transport = this.getTransport();

        const handler = this.handlers.get(request.method);

        if (!handler) {
            await this.sendError(
                request.id,
                JsonRpcErrorCode
                    .methodNotFound,
                `Method not found: ${request.method}`,
            );

            return;
        }

        const controller = new AbortController();

        this.active.set(request.id, controller);

        try {
            const result = await handler(
                request.params,
                controller.signal,
            );

            if (controller.signal.aborted) {
                return;
            }

            const response = {
                jsonrpc: "2.0" as const,
                id: request.id,
                result,
            };

            await transport.send(response);
        } catch (error) {
            if (controller.signal.aborted) {
                return;
            }

            await this.sendError(
                request.id,
                JsonRpcErrorCode
                    .internalError,
                error instanceof Error
                    ? error.message
                    : String(
                        error,
                    ),
            );
        } finally {
            this.active.delete(request.id);
        }
    }

    private handleNotification(
        notification: JsonRpcNotification,
    ): void {
        if (
            notification.method ===
            "$/cancelRequest"
        ) {
            const params =
                notification.params as
                | {
                    id?: JsonRpcId;
                }
                | undefined;

            if (
                params?.id !==
                undefined
            ) {
                this.active
                    .get(
                        params.id,
                    )
                    ?.abort();
            }

            return;
        }

        const handler = this.handlers.get(notification.method);

        if (!handler) {
            return;
        }

        const controller = new AbortController();

        void Promise.resolve(
            handler(
                notification.params,
                controller.signal,
            ),
        ).catch(() => { });
    }

    private async sendError(
        id: JsonRpcId | null,
        code: number,
        message: string,
        data?: unknown,
    ): Promise<void> {
        const transport = this.getTransport();

        const response = {
            jsonrpc: "2.0" as const,
            id,
            error: {
                code,
                message,
                data,
            },
        };

        await transport.send(response);
    }

    private getTransport():
        RpcTransport {
        if (!this.transport) {
            throw new Error(
                "RPC server is not connected",
            );
        }

        return this.transport;
    }
}