<script lang="ts">
    import { tick } from "svelte";
    import type { AgentEvent, MessageProps } from "../../lib/types";
    import { agentState } from "../../store/index.svelte";
    import Message from "../Message/index.svelte";
    import { fetchEventSource } from "@microsoft/fetch-event-source";
    import { eventsState } from "../../store/index.svelte";
    import "./styles.css";

    $effect(() => {
        messages;
        const last = getLastAssistantMsg(messages);
        if (!messagesEl || !last) return;

        if (last.status === "in_progress" && isNearBottom(messagesEl)) {
            scrollToBottom();
        }
    });

    let query = $state("");
    let messages = $state<MessageProps[]>([]);
    let messagesEl: HTMLElement | null = null;

    let retryCount = 0;
    const MAX_RETRIES = 3;
    let controller: AbortController | null = null;
    let toolIndexByArgsId = new Map<string, number>();

    function isNearBottom(
        el: HTMLElement,
        threshold = 40, // px
    ) {
        return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    }

    function getLastAssistantMsg(messages: MessageProps[]) {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === "assistant") {
                return messages[i];
            }
        }
        return null;
    }

    function upsertAssistantErr(
        content: MessageProps["content"],
        status: MessageProps["status"] = "incomplete",
    ) {
        const last = getLastAssistantMsg(messages);

        if (last) {
            last.content = content;
            last.status = status;
        } else {
            messages.push({
                role: "assistant",
                content,
                status,
            });
        }
    }

    async function sendMessage() {
        const text = query.trim();
        if (!text) return;

        messages.push(
            { role: "user", content: text },
            {
                role: "assistant",
                content: "Ожидание сервера",
                status: "in_progress",
            },
        );

        query = "";
        eventsState.events = [];
        toolIndexByArgsId.clear();

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
            }),
            signal: controller?.signal,
            async onopen() {
                retryCount = 0;
                hasStartedAnswer = false;
            },
            onmessage(ev) {
                const last = getLastAssistantMsg(messages);
                if (!last) return;

                if (ev.event === "init") {
                    last.content = ev.data;

                    eventsState.events.push({
                        type: "init",
                        message: ev.data,
                    });
                    return;
                }

                if (ev.event === "text_delta") {
                    const { delta } = JSON.parse(ev.data) as { delta: string };
                    // console.log("DELTA:", JSON.stringify(ev.data));
                    if (!hasStartedAnswer) {
                        last.content = "";
                        hasStartedAnswer = true;
                    }
                    last.content += delta;
                    messages = [...messages];
                }

                if (ev.event === "tool_start") {
                    const parsed = JSON.parse(ev.data) as {
                        name: string;
                        callId: string;
                        toolRound: number;
                        argsId: string;
                        args?: string;
                    };

                    const idx = toolIndexByArgsId.get(parsed.argsId);
                    if (idx === undefined) return;

                    const tool = eventsState.events[idx] as Extract<
                        AgentEvent,
                        { type: "tool_start" }
                    >;

                    tool.name = parsed.name;
                    tool.callId = parsed.callId;
                    tool.toolRound = parsed.toolRound;

                    return;
                }

                if (ev.event === "arguments_delta") {
                    const { delta, id: argsId } = JSON.parse(ev.data) as {
                        delta: string;
                        id: string;
                    };

                    let idx = toolIndexByArgsId.get(argsId);

                    if (idx === undefined) {
                        const tool: Extract<
                            AgentEvent,
                            { type: "tool_start" }
                        > = {
                            type: "tool_start",
                            toolRound: -1, // пока неизвестно
                            callId: "pending", // пока неизвестно
                            name: "…",
                            args: delta,
                            argsId,
                        };

                        eventsState.events.push(tool);
                        toolIndexByArgsId.set(
                            argsId,
                            eventsState.events.length - 1,
                        );
                    } else {
                        const tool = eventsState.events[idx] as Extract<
                            AgentEvent,
                            { type: "tool_start" }
                        >;
                        tool.args = (tool.args ?? "") + delta;
                    }

                    return;
                }

                if (ev.event === "tool_result") {
                    const parsed = JSON.parse(ev.data);

                    eventsState.events.push({
                        type: "tool_result",
                        toolRound: parsed.toolRound,
                        callId: parsed.callId,
                        name: parsed.name,
                        outputPreview: parsed.outputPreview,
                    });

                    return;
                }

                if (ev.event === "done") {
                    eventsState.events.push({
                        type: "done",
                        message: ev.data ?? "Done",
                    });
                    return;
                }

                if (ev.event === "error") {
                    last.status = "incomplete";
                    last.content = ev.data;

                    eventsState.events.push({
                        type: "error",
                        message: "Сервер недоступен",
                    });
                }
            },

            onclose() {
                const last = getLastAssistantMsg(messages);
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
                        message: "Сервер недоступен",
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
            {#each messages as m}
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

            <button class="send" onclick={sendMessage}> [ SEND ] </button>
        </footer>
    </div>
</div>
