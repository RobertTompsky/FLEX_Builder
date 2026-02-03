<script lang="ts">
    import { md } from "../../lib/utils/markdown";
    import { eventsState } from "../../store/index.svelte";
    import "./styles.css";

    let expanded = $state<Set<string>>(new Set<string>());

    function toggle(id: string) {
        const next = new Set(expanded);
        next.has(id) ? next.delete(id) : next.add(id);
        expanded = next;
    }

    function extractCode(raw: string): string {
        const parsed = JSON.parse(raw.trim()) as { code: string };
        return parsed.code;
    }
</script>

<aside class="progress-window">
    <div class="progress-head">EVENTS</div>

    <div class="progress-inner">
        <div class="progress-body">
            {#if eventsState.events.length === 0}
                <div class="progress-empty">No events</div>
            {:else}
                {#each eventsState.events as ev}
                    {#if ev.type === "init"}
                        <div class="progress-line root">■ ${ev.message}</div>
                    {/if}

                    {#if ev.type === "tool_start"}
                        <div class="progress-line tool">
                            ▣ TOOL: {ev.name} (ROUND {ev.toolRound})
                        </div>

                        {#if ev.args}
                            <button
                                type="button"
                                class="progress-line file"
                                onclick={() => toggle(`args-${ev.argsId}`)}
                            >
                                {expanded.has(`args-${ev.argsId}`) ? "▾" : "▸"} □
                                code.js
                            </button>

                            {#if expanded.has(`args-${ev.argsId}`)}
                                <div class="progress-content code">
                                    {@html md
                                        .render(
                                            `\`\`\`js\n${extractCode(ev.args)}\n\`\`\``,
                                        )
                                        .trimEnd()}
                                </div>
                            {/if}
                        {/if}
                    {/if}

                    {#if ev.type === "tool_result"}
                        <button
                            type="button"
                            class="progress-line file"
                            onclick={() => toggle(`res-${ev.callId}`)}
                        >
                            {expanded.has(`res-${ev.callId}`) ? "▾" : "▸"} □ RESULT.txt
                        </button>

                        {#if expanded.has(`res-${ev.callId}`)}
                            <pre class="progress-detail">{ev.outputPreview ??
                                    "OK"}            </pre>
                        {/if}
                    {/if}

                    {#if ev.type === "done"}
                        <div class="progress-line root">■ ${ev.message}</div>
                    {/if}

                    {#if ev.type === "error"}
                        <div class="progress-line error">
                            ■ ERROR: {ev.message}
                        </div>
                    {/if}
                {/each}
            {/if}
        </div>
    </div>

    <div class="progress-foot"></div>
</aside>
