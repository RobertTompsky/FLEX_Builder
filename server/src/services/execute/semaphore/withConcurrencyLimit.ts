import { ExecuteCall } from "../types";
import { Semaphore } from "./semaphore";

export function withConcurrencyLimit(
    execute: ExecuteCall,
    limit: number,
    delayMs = 0,
): ExecuteCall {
    const semaphore = new Semaphore(limit);

    return async (
        input,
        options,
    ) => {
        await semaphore.acquire(
            options?.signal,
        );

        try {
            return await execute(
                input,
                options,
            );
        } finally {
            if (delayMs > 0) {
                await sleep(
                    delayMs,
                    options?.signal,
                ).catch(
                    () => { },
                );
            }

            semaphore.release();
        }
    };
}

function sleep(
    ms: number,
    signal?: AbortSignal,
): Promise<void> {
    return new Promise<void>(
        (
            resolve,
            reject,
        ) => {
            const cleanup = () => {
                signal
                    ?.removeEventListener(
                        "abort",
                        onAbort,
                    );
            };
            
            const timeout = setTimeout(
                () => {
                    cleanup();
                    resolve();
                },
                ms,
            );

            const onAbort = () => {
                clearTimeout(timeout);
                cleanup();
                reject(
                    signal?.reason ??
                    new DOMException(
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

            if (signal?.aborted) {
                onAbort();
            }
        },
    );
}