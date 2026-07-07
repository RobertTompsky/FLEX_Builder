import { agentState } from "../../store/index.svelte";
import type { UIMessage } from "../types";

export function createStreamBuffer() {
    let tokenBuffer = "";
    let msg: UIMessage | null = null;
    let scheduled = false;

    function flush() {
        if (!msg || tokenBuffer.length === 0) return;

        if (msg.content === "Ожидание ответа") {
            msg.content = "";
        }

        msg.content += tokenBuffer;
        tokenBuffer = "";

        agentState.messages = agentState.messages;
    }

    function scheduleFlush() {
        if (scheduled) return;

        scheduled = true;

        requestAnimationFrame(() => {
            scheduled = false;
            flush();
        });
    }

    return {
        setMessage(message: UIMessage | null) {
            msg = message;
        },

        push(delta: string) {
            tokenBuffer += delta;
            scheduleFlush();
        },

        flush
    };
}

export function createDeltaBuffer<TKey extends string>(
    apply: (key: TKey, value: string) => void,
) {
    const pending = new Map<TKey, string>();
    let frameId: number | null = null;

    function flush() {
        frameId = null;

        for (const [key, delta] of pending) {
            apply(key, delta);
        }

        pending.clear();
    }

    return {
        push(key: TKey, delta: string) {
            pending.set(key, (pending.get(key) ?? "") + delta);

            if (frameId === null) {
                frameId = requestAnimationFrame(flush);
            }
        },

        flush() {
            if (frameId !== null) {
                cancelAnimationFrame(frameId);
                frameId = null;
            }

            flush();
        },
    };
}