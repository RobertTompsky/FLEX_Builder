const SANDBOX_EVENT_PREFIX = "__SANDBOX_EVENT__:";

type SandboxEvent = {
    event: string;
    data: unknown;
};

type SandboxProtocolHandler<
    TEvent extends SandboxEvent,
> = {
    onEvent?: (
        event: TEvent,
    ) => void | Promise<void>;
};

export function createSandboxEventProtocol<
    TEvent extends SandboxEvent,
>({
    onEvent,
}: SandboxProtocolHandler<TEvent> = {}) {
    return async function handleLine(
        line: string,
    ): Promise<string | undefined> {
        if (!line.startsWith(SANDBOX_EVENT_PREFIX)) {
            return line;
        }

        const raw = line.slice(SANDBOX_EVENT_PREFIX.length);

        try {
            const event = JSON.parse(raw) as TEvent;

            await onEvent?.(event);

            return undefined;
        } catch {
            return line;
        }
    };
}