import { fetchEventSource, type EventSourceMessage } from "@microsoft/fetch-event-source";
import { agentState, eventsState } from "../store/index.svelte";
import type { AgentEvent, UIMessage } from "../lib/types";
import { tick } from "svelte";
import { createStreamBuffer } from "../lib/utils/createStreamBuffer";

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

function parseSSE(ev: EventSourceMessage): AgentEvent {
    return {
        type: ev.event,
        data: JSON.parse(ev.data),
    } as AgentEvent;
}

export const callAgent = async (
    { query, toolCallIds }: { query?: string, toolCallIds?: string[] }
) => {
    console.log(toolCallIds)
    const isResume = Array.isArray(toolCallIds)

    if (!query && !isResume) {
        return;
    }

    const MAX_RETRIES = 3;
    let retryCount = 0;
    let msg: UIMessage | null = null;
    let runId: string;

    if (isResume) {
        if (!agentState.runId) {
            console.error("Resume called without runId");
            return;
        }
        runId = agentState.runId;
    } else {
        runId = crypto.randomUUID();
        agentState.runId = runId;
    }

    if (query) {
        agentState.messages.push(
            {
                role: "user",
                content: query
            },
            {
                role: "assistant",
                content: "",
                status: "incomplete",
            }
        );
    }

    const last = agentState.messages.at(-1);
    if (last?.role === "assistant") {
        msg = last;
    }

    streamBuffer.setMessage(msg);

    if (controller) {
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
        toolCallIds,
        runId
    };

    await fetchEventSource(`http://localhost:3000/mcp/${runId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller?.signal,
        async onopen() {
            retryCount = 0;
            if (!isResume) {
                eventsState.events = []
            }
            console.log(toolCallIds)
        },
        onmessage(ev) {
            if (!msg) return;

            const event = parseSSE(ev);

            switch (event.type) {
                case "text_delta":
                    if (msg.status!== 'in_progress') msg.status = "in_progress";
                    streamBuffer.push(event.data.delta);
                    return;

                case "end":
                    msg.status = "completed";
                    eventsState.events.push(event);
                    agentState.runId = null;
                    return;

                case "error":
                    msg.status = "incomplete";
                    msg.content = event.data.message;
                    eventsState.events.push(event);
                    agentState.runId = null;
                    return;

                default:
                    eventsState.events.push(event);
            }
        },

        onclose() {
            if (!msg) return;

            if (eventsState.events.at(-1)?.type === "pause") {
                msg.status = "incomplete";
            } else if (msg.status !== "incomplete") {
                msg.status = "completed";
            }
        },

        onerror(err) {
            retryCount++;
            console.error("SSE error:", err);

            if (retryCount >= MAX_RETRIES) {
                controller?.abort();
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