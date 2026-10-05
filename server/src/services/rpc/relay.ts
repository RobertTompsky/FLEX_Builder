import type {
    JsonRpcId,
    JsonRpcMessage,
    JsonRpcNotification,
    JsonRpcRequest,
} from "./protocol";

import {
    isJsonRpcNotification,
    isJsonRpcRequest,
    isJsonRpcResponse,
    JsonRpcNotificationMethod,
} from "./protocol";

import type {
    RpcTransport,
} from "./transport";


type RelayChannel = {
    transport:
        RpcTransport;
};


type PendingRequest = {
    executionId:
        string;
};


type RpcRelayOptions = {
    upstream:
        RpcTransport;
};


export type RpcRelayAttachment = {
    close():
        Promise<void>;
};


export class RpcRelay {

    private readonly channels =
        new Map<
            string,
            RelayChannel
        >();

    /*
     * Request ids are globally unique,
     * so requestId is enough to route
     * the response back to its execution.
     */
    private readonly pending =
        new Map<
            JsonRpcId,
            PendingRequest
        >();

    private unsubscribeUpstream:
        (() => void)
        | undefined;


    constructor(
        private readonly options:
            RpcRelayOptions,
    ) { }


    connect(): void {
        if (
            this.unsubscribeUpstream
        ) {
            return;
        }

        this.unsubscribeUpstream =
            this.options.upstream
                .onMessage(
                    message =>
                        this.fromUpstream(
                            message,
                        ),
                );
    }


    async attach(
        executionId:
            string,

        transport:
            RpcTransport,
    ): Promise<
        RpcRelayAttachment
    > {

        if (
            this.channels.has(
                executionId,
            )
        ) {
            throw new Error(
                `Execution "${executionId}" is already attached`,
            );
        }


        await transport.connect();


        this.channels.set(
            executionId,
            {
                transport,
            },
        );


        const unsubscribeMessage =
            transport.onMessage(
                message =>
                    this.fromDownstream(
                        executionId,
                        message,
                    ),
            );


        const unsubscribeDisconnect =
            transport.onDisconnect(
                () => {
                    void this.detach(
                        executionId,
                        false,
                    );
                },
            );


        let closed =
            false;


        return {
            close:
                async () => {
                    if (closed) {
                        return;
                    }

                    closed =
                        true;

                    unsubscribeMessage();
                    unsubscribeDisconnect();

                    await this.detach(
                        executionId,
                        true,
                    );
                },
        };
    }


    close(): void {
        this.unsubscribeUpstream?.();

        this.unsubscribeUpstream =
            undefined;

        this.pending.clear();
        this.channels.clear();
    }


    private async fromDownstream(
        executionId:
            string,

        message:
            JsonRpcMessage,
    ): Promise<void> {
console.error(
    "[relay] DOWNSTREAM",
    executionId,
    message,
);
        if (
            isJsonRpcNotification(
                message,
            ) &&
            message.method ===
                JsonRpcNotificationMethod.cancelRequest
        ) {
            await this.cancelRequest(
                executionId,
                message,
            );

            return;
        }


        if (
            isJsonRpcRequest(
                message,
            )
        ) {
            await this.forwardRequest(
                executionId,
                message,
            );

            return;
        }


        /*
         * Other downstream messages are simply
         * forwarded. In practice execution should
         * mostly produce requests + notifications.
         */
        await this.options
            .upstream
            .send(
                message,
            );
    }


    private async forwardRequest(
        executionId:
            string,

        request:
            JsonRpcRequest,
    ): Promise<void> {

        if (
            !this.channels.has(
                executionId,
            )
        ) {
            return;
        }


        /*
         * UUID request ids should make this impossible,
         * but failing loudly here is much nicer than
         * routing a response to the wrong execution.
         */
        if (
            this.pending.has(
                request.id,
            )
        ) {
            throw new Error(
                `Duplicate RPC request id: ${String(
                    request.id,
                )}`,
            );
        }


        this.pending.set(
            request.id,
            {
                executionId,
            },
        );


        try {
            await this.options
                .upstream
                .send(
                    request,
                );

        } catch (error) {
            this.pending.delete(
                request.id,
            );

            throw error;
        }
    }


    private async fromUpstream(
        message:
            JsonRpcMessage,
    ): Promise<void> {

        /*
         * The upstream transport is shared with
         * SandboxRpcServer, so relay only consumes
         * responses belonging to execution requests.
         */
        if (
            !isJsonRpcResponse(
                message,
            ) ||
            message.id === null
        ) {
            return;
        }


        const pending =
            this.pending.get(
                message.id,
            );

        if (!pending) {
            return;
        }


        this.pending.delete(
            message.id,
        );


        const channel =
            this.channels.get(
                pending.executionId,
            );

        if (!channel) {
            return;
        }


        await channel.transport
            .send(
                message,
            );
    }


    private async cancelRequest(
        executionId:
            string,

        notification:
            JsonRpcNotification,
    ): Promise<void> {

        const params =
            notification.params as
                | {
                    id?:
                        JsonRpcId;
                }
                | undefined;

        const requestId =
            params?.id;

        if (
            requestId ===
            undefined
        ) {
            return;
        }


        const pending =
            this.pending.get(
                requestId,
            );

        /*
         * Don't allow one execution to cancel
         * another execution's request.
         */
        if (
            !pending ||
            pending.executionId !==
                executionId
        ) {
            return;
        }


        /*
         * RpcServer doesn't send a response for an
         * aborted request, so relay owns cleanup here.
         */
        this.pending.delete(
            requestId,
        );


        await this.options
            .upstream
            .send(
                notification,
            );
    }


    private async detach(
        executionId:
            string,

        closeTransport:
            boolean,
    ): Promise<void> {

        const channel =
            this.channels.get(
                executionId,
            );

        if (!channel) {
            return;
        }


        /*
         * Execution is disappearing, so cancel every
         * upstream operation belonging to it.
         */
        for (
            const [
                requestId,
                pending,
            ]
            of this.pending
        ) {
            if (
                pending.executionId !==
                executionId
            ) {
                continue;
            }


            this.pending.delete(
                requestId,
            );


            await this.options
                .upstream
                .send({
                    jsonrpc:
                        "2.0",

                    method:
                        JsonRpcNotificationMethod
                            .cancelRequest,

                    params: {
                        id:
                            requestId,
                    },
                })
                .catch(
                    () => { },
                );
        }


        this.channels.delete(
            executionId,
        );


        if (closeTransport) {
            await channel.transport
                .close();
        }
    }
}