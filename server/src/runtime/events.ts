import { CapabilityEvent } from "../capabilities/events";

export const RUNTIME_EVENT_PREFIX = "__RUNTIME_EVENT__:";

export type RuntimeEvent = CapabilityEvent

export function emitRuntimeEvent(event: RuntimeEvent): void {
    process.stdout.write(
        `${RUNTIME_EVENT_PREFIX}${JSON.stringify(event)}\n`,
    );
}

export function createRuntimeEmitter<
    TEvent extends {
        event: string;
        data: unknown;
    },
>() {
    return (
        event: TEvent,
    ): void => {
        process.stdout.write(
            `${RUNTIME_EVENT_PREFIX}${JSON.stringify(event)}\n`,
        );
    };
}