import {
    parseRpcMessage,
    serializeRpcMessage,
} from "./protocol";

type CallOptions = {
    signal?: AbortSignal;
};

type PendingCall = {
    resolve(
        value: unknown,
    ): void;

    reject(
        error: Error,
    ): void;

    cleanup(): void;
};

const MAX_CONCURRENT_RPC_CALLS = 16;

export type CapabilityRpcClient = {
    call(
        action: string,
        args: unknown,
        options?: CallOptions,
    ): Promise<unknown>;

    close(): Promise<void>;
};

export function createCapabilityRpcClient(): CapabilityRpcClient {
    const pending = new Map<string, PendingCall>();

    const reader = Bun.stdin.stream().getReader();

    let closed = false;

    const readTask =
        (async () => {
            const decoder = new TextDecoder();

            let buffer = "";

            try {
                while (!closed) {
                    const {
                        value,
                        done,
                    } = await reader.read();

                    if (done) {
                        break;
                    }

                    buffer += decoder.decode(
                        value,
                        {
                            stream: true,
                        },
                    );

                    const lines = buffer.split("\n");

                    buffer = lines.pop() ?? "";

                    for (const line of lines) {
                        const message =
                            parseRpcMessage(
                                line,
                            );

                        if (
                            !message ||
                            message.type !==
                            "capability_result"
                        ) {
                            continue;
                        }

                        const request =
                            pending.get(
                                message.id,
                            );

                        if (!request) {
                            continue;
                        }

                        pending.delete(
                            message.id,
                        );

                        request.cleanup();

                        if (message.ok) {
                            request.resolve(
                                message.result,
                            );
                        } else {
                            request.reject(
                                new Error(
                                    message.error,
                                ),
                            );
                        }
                    }
                }
            } finally {
                for (
                    const request
                    of pending.values()
                ) {
                    request.cleanup();

                    request.reject(
                        new Error(
                            "Capability RPC client closed",
                        ),
                    );
                }

                pending.clear();
            }
        })();

    async function call(
        action: string,
        args: unknown,
        options: CallOptions = {},
    ): Promise<unknown> {
        if (closed) {
            throw new Error(
                "Capability RPC client is closed",
            );
        }

        if (
            pending.size >=
            MAX_CONCURRENT_RPC_CALLS
        ) {
            throw new Error(
                `Too many concurrent capability calls. Max: ${MAX_CONCURRENT_RPC_CALLS}`,
            );
        }

        const id =
            crypto.randomUUID();

        const {
            signal,
        } = options;

        if (signal?.aborted) {
            throw new Error(
                "Capability RPC call aborted",
            );
        }

        const result =
            new Promise<unknown>(
                (
                    resolve,
                    reject,
                ) => {
                    const abort =
                        () => {
                            if (
                                !pending.has(
                                    id,
                                )
                            ) {
                                return;
                            }

                            pending.delete(
                                id,
                            );

                            process.stdout.write(
                                serializeRpcMessage({
                                    type:
                                        "capability_cancel",
                                    id,
                                }) + "\n",
                            );

                            reject(
                                new Error(
                                    "Capability RPC call aborted",
                                ),
                            );
                        };

                    const cleanup =
                        () => {
                            signal
                                ?.removeEventListener(
                                    "abort",
                                    abort,
                                );
                        };

                    pending.set(
                        id,
                        {
                            resolve,
                            reject,
                            cleanup,
                        },
                    );

                    signal
                        ?.addEventListener(
                            "abort",
                            abort,
                            {
                                once: true,
                            },
                        );
                },
            );

        process.stdout.write(
            serializeRpcMessage({
                type:
                    "capability_call",
                id,
                action,
                args,
            }) + "\n",
        );

        return result;
    }

    async function close() {
        if (closed) {
            return;
        }

        closed = true;

        await reader.cancel();

        await readTask.catch(() => { });
    }

    return {
        call,
        close,
    };
}
