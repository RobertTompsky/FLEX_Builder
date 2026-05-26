import { fetchEventSource } from "@microsoft/fetch-event-source";
import { agentState, eventsState } from "../store/index.svelte";
import type { AgentEvent, UIMessage } from "../lib/types";
import { tick } from "svelte";
import { createStreamBuffer } from "../lib/utils/createStreamBuffer";

const URL = 'http://localhost:3000'

let controller: AbortController | null = null;

const streamBuffer = createStreamBuffer();

function upsertAssistantErr(
    msg: UIMessage | null,
    content: UIMessage["content"],
    status: UIMessage["status"] = "incomplete"
) {
    if (msg) {
        msg.content = content;
        msg.status = status;
    } else {
        agentState.messages.push({
            role: "assistant",
            content,
            status,
        });
    }
}

export const callAgent = async (
    { query }: { query: string | null }
) => {
    const isResume = query === null

    if (!isResume && !query.trim()) {
        return;
    }

    const MAX_RETRIES = 3;
    let retryCount = 0;
    let msg: UIMessage | null = null;
    let runId = crypto.randomUUID();

    if (query) {
        agentState.messages.push(
            {
                role: "user",
                content: query,
                status: 'completed'
            },
            {
                role: "assistant",
                content: "",
                status: "in_progress",
            }
        );
    }

    const last = agentState.messages.at(-1);
    if (last?.role === "assistant") {
        msg = last;
    }

    agentState.runId = runId

    streamBuffer.setMessage(msg);

    if (controller && !controller.signal.aborted) {
        controller.abort();
    }
    controller = new AbortController();

    await tick();

    const payload = {
        query,
        model: agentState.model,
        prompt: agentState.prompt,
        toolRounds: agentState.toolRounds,
        skills: agentState.skills,
        pause: agentState.pause,
        runId
    };

    await fetchEventSource(`${URL}/mcp/${runId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller?.signal,
        async onopen() {
            retryCount = 0;
            if (!isResume) {
                eventsState.events = []
            }
        },
        onmessage(ev) {
            if (!msg) return;

            const event = {
                type: ev.event,
                data: JSON.parse(ev.data),
            } as AgentEvent;

            switch (event.type) {
                case "text_delta":
                    if (msg.status !== 'in_progress') msg.status = "in_progress";
                    streamBuffer.push(event.data.delta);
                    return;

                case "end":
                    controller = null;
                    msg.status = "completed";
                    eventsState.events.push(event);
                    agentState.runId = null;
                    return;

                case "error":
                    controller = null;
                    msg.status = "incomplete";
                    msg.content = event.data.message;
                    eventsState.events.push(event);
                    agentState.runId = null;
                    return;

                case "stop":
                    controller = null;
                    if (!msg.content.trim()) {
                        msg.content = "[ STOPPED BY USER ]";
                    }
                    msg.status = "incomplete";
                    eventsState.events.push(event);
                    agentState.runId = null;
                    return;

                default:
                    eventsState.events.push(event);
            }
        },

        onclose() {
            if (!msg) return;
            console.log("[client] sse closed; last event =", eventsState.events.at(-1)?.type);
        },

        onerror(err) {
            if (controller?.signal.aborted || !agentState.runId) {
                console.log("[client] SSE aborted/finished");
                throw err;
            }

            retryCount++;
            console.error("SSE error:", err);

            if (retryCount >= MAX_RETRIES) {
                controller?.abort();
                controller = null;
                agentState.runId = null;
                upsertAssistantErr(msg, "Сервер недоступен.", "incomplete");
                eventsState.events.push({
                    type: "error",
                    data: { message: "Сервер недоступен" },
                });
                throw err;
            }

            upsertAssistantErr(
                msg,
                `Ошибка соединения. Повтор (${retryCount}/${MAX_RETRIES})`,
                "in_progress",
            );
        },
    });
}

export async function stopAgent(runId: string) {
    if (!runId) return;

    await fetchEventSource(`${URL}/runs/${runId}/stop`, {
        method: "POST",

        onmessage(ev) {
            const event = {
                type: ev.event,
                data: JSON.parse(ev.data),
            } as AgentEvent;

            if (event.type === "stop") {
                eventsState.events = eventsState.events.filter(
                    (e) => e.type !== "pause",
                );
                eventsState.events.push(event);
                const last = agentState.messages.at(-1);

                if (!last) throw Error('Last message is not from AI')

                const hasStartedText = last.content.trim().length > 0;

                if (!hasStartedText) {
                    last.content = "[ STOPPED BY USER ]";
                }

                last.status = "incomplete";
                agentState.runId = null;
                return;
            }

            eventsState.events.push(event);
        },

        onerror(err) {
            console.error("Failed to stop run on server", err);
            throw err;
        },
    });
}

export async function processToolCalls(toolCallIds: string[]) {
    await fetchEventSource(`${URL}/handleToolcalls`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            toolCallIds,
            skills: agentState.skills,
        }),
        onmessage(ev) {
            const event = {
                type: ev.event,
                data: JSON.parse(ev.data),
            } as AgentEvent;

            eventsState.events.push(event);
        },
        onerror(err) {
            console.error("processToolCalls error", err);
            throw err;
        },
    });
}

export async function clearHistory() {
    try {
        const res = await fetch(`${URL}/clearHistory`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        agentState.messages = [];
        eventsState.events = [];
    } catch (e) {
        console.error("Failed to clear history", e);
    }
}