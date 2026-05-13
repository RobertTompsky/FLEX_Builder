<script lang="ts">
    import { agentState, infoState } from "../../store/index.svelte";
    import Message from "../Message/index.svelte";
    import "./styles.css";
    import { callAgent, clearHistory, stopAgent } from "../../api/callAgent";

    let query = $state("");

    const lastMessage = $derived(agentState.messages.at(-1));

    async function send(e: Event) {
        e.preventDefault();
        if (
            lastMessage?.role === "assistant" &&
            lastMessage.status === "in_progress"
        ) {
            await stopAgent(agentState.runId!);
        } else {
            const text = query.trim();
            if (!text) return;

            query = ""; // очищаем поле сразу
            await callAgent({ query: text });
        }
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
        <section class="messages">
            {#each agentState.messages as m}
                <Message content={m.content} role={m.role} status={m.status} />
            {/each}
        </section>

        <footer class="bottom-bar">
            <textarea
                class="input main"
                bind:value={query}
                placeholder="Введите сообщение..."
                onkeydown={async (e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        send(e);
                    }
                }}
            ></textarea>

            <button
                class="send"
                onclick={async (e) => await send(e)}
                disabled={!!infoState.error || infoState.loading}
            >
                {lastMessage?.status === "in_progress"
                    ? "[ STOP ]"
                    : "[ SEND ]"}
            </button>
        </footer>
    </div>
</div>
