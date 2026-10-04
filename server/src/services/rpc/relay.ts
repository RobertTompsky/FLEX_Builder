import {
    randomUUID,
} from "crypto";

import type {
    JsonRpcId,
    JsonRpcMessage,
    JsonRpcNotification,
    JsonRpcRequest,
    JsonRpcResponse,
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

    active:
        number;

    queue:
        JsonRpcRequest[];

    upstreamByDownstream:
        Map<
            JsonRpcId,
            JsonRpcId
        >;
};


type PendingRequest = {
    executionId:
        string;

    downstreamId:
        JsonRpcId;
};


type RpcRelayOptions = {
    upstream:
        RpcTransport;

    maxConcurrency:
        number;
};


export class RpcRelay {

    private readonly channels =
        new Map<
            string,
            RelayChannel
        >();

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
        () => Promise<void>
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


        const channel:
            RelayChannel = {
                transport,

                active:
                    0,

                queue:
                    [],

                upstreamByDownstream:
                    new Map(),
            };


        this.channels.set(
            executionId,
            channel,
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


        return async () => {
            unsubscribeMessage();
            unsubscribeDisconnect();

            await this.detach(
                executionId,
                true,
            );
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
            !isJsonRpcRequest(
                message,
            )
        ) {
            await this.options
                .upstream
                .send(
                    message,
                );

            return;
        }


        const channel =
            this.channels.get(
                executionId,
            );

        if (!channel) {
            return;
        }


        if (
            channel.active >=
            this.options.maxConcurrency
        ) {
            channel.queue.push(
                message,
            );

            return;
        }


        await this.forwardRequest(
            executionId,
            message,
        );
    }


    private async cancelRequest(
        executionId:
            string,

        notification:
            JsonRpcNotification,
    ): Promise<void> {

        const channel =
            this.channels.get(
                executionId,
            );

        if (!channel) {
            return;
        }


        const params =
            notification.params as
                | {
                    id?:
                        JsonRpcId;
                }
                | undefined;

        const downstreamId =
            params?.id;

        if (
            downstreamId ===
            undefined
        ) {
            return;
        }


        /*
         * Request hasn't been forwarded yet.
         *
         * Remove it from the local concurrency
         * queue. The server has never seen it,
         * so there is nothing to cancel upstream.
         */
        const queuedIndex =
            channel.queue
                .findIndex(
                    request =>
                        request.id ===
                        downstreamId,
                );

        if (
            queuedIndex !==
            -1
        ) {
            channel.queue.splice(
                queuedIndex,
                1,
            );

            return;
        }


        /*
         * Request is already running upstream.
         *
         * Translate the child-local request id
         * into the id visible to RpcServer.
         */
        const upstreamId =
            channel
                .upstreamByDownstream
                .get(
                    downstreamId,
                );

        if (
            upstreamId ===
            undefined
        ) {
            return;
        }


        await this.options
            .upstream
            .send({
                ...notification,

                params: {
                    ...params,

                    id:
                        upstreamId,
                },
            });
    }


    private async fromUpstream(
        message:
            JsonRpcMessage,
    ): Promise<void> {

        /*
         * Upstream is shared with SandboxRpcServer,
         * so ignore messages unrelated to requests
         * routed through this relay.
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


        channel
            .upstreamByDownstream
            .delete(
                pending.downstreamId,
            );


        channel.active =
            Math.max(
                0,
                channel.active - 1,
            );


        await channel.transport
            .send(
                withResponseId(
                    message,
                    pending.downstreamId,
                ),
            );


        await this.flush(
            pending.executionId,
        );
    }


    private async forwardRequest(
        executionId:
            string,

        request:
            JsonRpcRequest,
    ): Promise<void> {

        const channel =
            this.channels.get(
                executionId,
            );

        if (!channel) {
            return;
        }


        const upstreamId =
            randomUUID();


        const upstreamRequest:
            JsonRpcRequest = {
                ...request,

                id:
                    upstreamId,
            };


        channel.active++;


        channel
            .upstreamByDownstream
            .set(
                request.id,
                upstreamId,
            );


        this.pending.set(
            upstreamId,
            {
                executionId,

                downstreamId:
                    request.id,
            },
        );


        try {
            await this.options
                .upstream
                .send(
                    upstreamRequest,
                );

        } catch (error) {

            this.pending.delete(
                upstreamId,
            );

            channel
                .upstreamByDownstream
                .delete(
                    request.id,
                );

            channel.active =
                Math.max(
                    0,
                    channel.active - 1,
                );

            await this.flush(
                executionId,
            );

            throw error;
        }
    }


    private async flush(
        executionId:
            string,
    ): Promise<void> {

        const channel =
            this.channels.get(
                executionId,
            );

        if (!channel) {
            return;
        }


        while (
            channel.active <
                this.options.maxConcurrency &&
            channel.queue.length > 0
        ) {
            const request =
                channel.queue.shift();

            if (!request) {
                return;
            }


            await this.forwardRequest(
                executionId,
                request,
            );
        }
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
         * Child is going away.
         *
         * Cancel every request from this execution
         * that is already running on the server.
         */
        for (
            const upstreamId
            of channel
                .upstreamByDownstream
                .values()
        ) {
            await this.options
                .upstream
                .send({
                    jsonrpc:
                        "2.0",

                    method:
                        JsonRpcNotificationMethod.cancelRequest,

                    params: {
                        id:
                            upstreamId,
                    },
                })
                .catch(
                    () => { },
                );

            this.pending.delete(
                upstreamId,
            );
        }


        channel
            .upstreamByDownstream
            .clear();

        channel.queue.length =
            0;


        this.channels.delete(
            executionId,
        );


        if (closeTransport) {
            await channel.transport
                .close();
        }
    }
}


function withResponseId(
    response:
        JsonRpcResponse,

    id:
        JsonRpcId,
): JsonRpcResponse {

    return {
        ...response,

        id,
    };
}