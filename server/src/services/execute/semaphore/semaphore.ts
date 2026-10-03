type Waiter = {
    resolve(): void;
    reject(error: unknown): void;
    signal?: AbortSignal;
    onAbort?: () => void;
};

export class Semaphore {
    private active = 0;

    private readonly queue: Waiter[] = [];

    constructor(
        private readonly limit: number,
    ) {
        if (limit < 1) {
            throw new Error(
                "Semaphore limit must be greater than 0",
            );
        }
    }

    async acquire(
        signal?: AbortSignal,
    ): Promise<void> {
        signal?.throwIfAborted();

        if (this.active < this.limit) {
            this.active++;

            return;
        }

        await new Promise<void>(
            (resolve, reject) => {
                const waiter: Waiter = {
                    resolve,
                    reject,
                    signal,
                };

                const onAbort = () => {
                    const index = this.queue.indexOf(waiter);

                    if (index !== -1) {
                        this.queue.splice(index, 1);
                    }

                    reject(
                        signal?.reason ??
                        new DOMException(
                            "The operation was aborted",
                            "AbortError",
                        ),
                    );
                };

                waiter.onAbort = onAbort;

                signal?.addEventListener(
                    "abort",
                    onAbort,
                    {
                        once: true,
                    },
                );

                this.queue.push(waiter);

                if (signal?.aborted) {
                    onAbort();
                }
            },
        );
    }

    release(): void {
        const waiter = this.queue.shift();

        if (waiter) {
            if (waiter.onAbort) {
                waiter.signal
                    ?.removeEventListener(
                        "abort",
                        waiter.onAbort,
                    );
            }

            // Слот сразу передаётся следующему:
            // active остаётся прежним.
            waiter.resolve();

            return;
        }

        this.active--;
    }
}