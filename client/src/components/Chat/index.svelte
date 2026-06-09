<script lang="ts">
    import { agentState, infoState } from "../../store/index.svelte";
    import Message from "../Message/index.svelte";
    import "./styles.css";
    import {
        callAgent,
        clearHistory,
        stopAgent,
        uploadFiles,
    } from "../../api/callAgent";
    import type { UploadEvent } from "../../lib/types";

    let query = $state("");
    let fileInput = $state<HTMLInputElement | null>(null);
    let files = $state<File[]>([]);
    let uploading = $state(false);

    const lastMessage = $derived(agentState.messages.at(-1));
    const filesLabel = $derived(
        files.length ? `${files.length} file(s)` : "No files",
    );

    async function upload() {
        if (!files.length || uploading) return;

        uploading = true;

        try {
            await uploadFiles(files);
            files = [];

            if (fileInput) {
                fileInput.value = "";
            }
        } catch (error) {
            console.error("upload error:", error);
        } finally {
            uploading = false;
        }
    }

    async function send(e: Event) {
        e.preventDefault();

        if (
            lastMessage?.role === "assistant" &&
            lastMessage.status === "in_progress"
        ) {
            await stopAgent(agentState.runId!);
            return;
        }

        const text = query.trim();
        if (!text && !files.length) return;

        let uploadResult: Extract<UploadEvent, { event: "upload_done" }>[] = [];

        if (files.length > 0) {
            uploading = true;

            try {
                uploadResult = await uploadFiles(files);
                files = [];

                if (fileInput) {
                    fileInput.value = "";
                }
            } catch (error) {
                console.error("upload error:", error);
                return;
            } finally {
                uploading = false;
            }
        }

        query = "";

        await callAgent({
            query: text,
            files: uploadResult.map((ev) => ev.data.filename),
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
        <section class="messages">
            {#each agentState.messages as m}
                <Message content={m.content} role={m.role} status={m.status} />
            {/each}
        </section>

        <footer class="bottom-bar">
            <input
                bind:this={fileInput}
                class="file-input"
                type="file"
                multiple
                accept=".txt,.md,.json,.csv,.xml,.js,.ts"
                onchange={(e) => {
                    const input = e.currentTarget as HTMLInputElement;
                    files = Array.from(input.files ?? []);
                }}
            />

            <button
                class="file-button"
                type="button"
                onclick={() => fileInput?.click()}
                disabled={uploading ||
                    lastMessage?.status === "in_progress" ||
                    !!infoState.error ||
                    infoState.loading}
            >
                [ FILE ]
            </button>

            <div class="file-label" title={files.map((f) => f.name).join(", ")}>
                {filesLabel}
            </div>

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
