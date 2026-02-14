<script lang="ts">
    import { tick } from "svelte";
    import type { AgentEvent, UIMessage } from "../../lib/types";
    import { agentState, infoState } from "../../store/index.svelte";
    import Message from "../Message/index.svelte";
    import {
        fetchEventSource,
        type EventSourceMessage,
    } from "@microsoft/fetch-event-source";
    import { eventsState } from "../../store/index.svelte";
    import "./styles.css";

    $effect(() => {
        const last = getLastAssistantMsg(agentState.messages);
        if (!messagesEl || !last) return;

        if (last.status === "in_progress" && isNearBottom(messagesEl)) {
            scrollToBottom();
        }
    });

    let query = $state("");
    let messagesEl: HTMLElement | null = null;

    let retryCount = 0;
    const MAX_RETRIES = 3;
    let controller: AbortController | null = null;

    function isNearBottom(
        el: HTMLElement,
        threshold = 40, // px
    ) {
        return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    }

    function getLastAssistantMsg(messages: UIMessage[]) {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === "assistant") {
                return messages[i];
            }
        }
        return null;
    }

    function upsertAssistantErr(
        content: UIMessage["content"],
        status: UIMessage["status"] = "incomplete",
    ) {
        const last = getLastAssistantMsg(agentState.messages);

        if (last) {
            last.content = content;
            last.status = status;
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

    async function sendMessage() {
        const text = query.trim();
        if (!text) return;

        agentState.messages.push(
            { role: "user", content: text },
            {
                role: "assistant",
                content: "Ожидание ответа",
                status: "in_progress",
            },
        );

        query = "";
        eventsState.events = [];

        controller?.abort();
        controller = new AbortController();

        await tick();
        scrollToBottom();
        let hasStartedAnswer = false;

        await fetchEventSource("http://localhost:3000/mcp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: text,
                model: agentState.model,
                prompt: agentState.prompt,
                toolRounds: agentState.toolRounds,
                skills: agentState.skills,
            }),
            signal: controller?.signal,
            async onopen() {
                retryCount = 0;
                hasStartedAnswer = false;
            },
            onmessage(ev) {
                const last = getLastAssistantMsg(agentState.messages);
                if (!last) return;

                const event = parseSSE(ev);

                switch (event.type) {
                    case "text_delta":
                        if (!hasStartedAnswer) {
                            last.content = "";
                            hasStartedAnswer = true;
                        }
                        last.content += event.data.delta;
                        return;

                    case "done":
                        last.status = "completed";
                        eventsState.events.push(event);
                        return;

                    case "error":
                        last.status = "incomplete";
                        last.content = event.data.message;
                        eventsState.events.push(event);
                        return;

                    default:
                        eventsState.events.push(event);
                }
            },

            onclose() {
                const last = getLastAssistantMsg(agentState.messages);
                if (!last) return;
                last.status = "completed";
            },

            onerror(err) {
                retryCount++;
                console.error("SSE error:", err);

                if (retryCount >= MAX_RETRIES) {
                    controller?.abort();
                    upsertAssistantErr("Сервер недоступен.", "incomplete");
                    eventsState.events.push({
                        type: "error",
                        data: { message: "Сервер недоступен" },
                    });
                    throw err;
                }

                upsertAssistantErr(
                    `Ошибка соединения. Повтор (${retryCount}/${MAX_RETRIES})`,
                    "in_progress",
                );
            },
        });
    }

    async function clearHistory() {
        try {
            const res = await fetch("http://localhost:3000/clearHistory");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            agentState.messages = [];
            eventsState.events = [];
        } catch (e) {
            console.error("Failed to clear history", e);
        }
    }

    async function scrollToBottom() {
        await tick();
        messagesEl?.scrollTo({
            top: messagesEl.scrollHeight,
            behavior: "smooth",
        });
    }
</script>

<div class="interface">
    <header class="header">
        <div class="titlebar">
            <h1 class="title">Chat</h1>
            <div class="title-controls">
                <button class="button">c</button>
                <button class="button">ev</button>
                <button class="button clear" onclick={clearHistory}>✕</button>
            </div>
        </div>
        <nav class="menubar">
            <span>File</span>
            <span>Edit</span>
            <span>View</span>
            <span>Help</span>
        </nav>
    </header>

    <div class="window-body">
        <section class="messages" bind:this={messagesEl}>
            {#each agentState.messages as m}
                <Message content={m.content} role={m.role} status={m.status} />
            {/each}
        </section>

        <footer class="bottom-bar">
            <textarea
                class="input main"
                bind:value={query}
                placeholder="Введите сообщение..."
                onkeydown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                }}
            ></textarea>

            <button
                class="send"
                onclick={sendMessage}
                disabled={!!infoState.error || infoState.loading}
            >
                [ SEND ]
            </button>
        </footer>
    </div>
</div>
