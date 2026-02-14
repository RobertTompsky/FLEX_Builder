<script lang="ts">
    import type { AgentEvent } from "../../lib/types";
    import { md } from "../../lib/utils/markdown";
    import { eventsState } from "../../store/index.svelte";
    import "./styles.css";

    let expanded = $state<Set<string>>(new Set<string>());
    let bodyEl: HTMLElement | null = null;

    $effect(() => {
        eventsState.events;
        if (bodyEl) {
            requestAnimationFrame(() => {
                bodyEl?.scrollTo({
                    top: bodyEl.scrollHeight,
                    behavior: "smooth",
                });
            });
        }
    });

    function buildEvents(events: AgentEvent[]) {
        const getArgs = (itemId: string) =>
            events
                .filter(
                    (
                        e,
                    ): e is Extract<AgentEvent, { type: "arguments_delta" }> =>
                        e.type === "arguments_delta" && e.data.id === itemId,
                )
                .map((e) => e.data.delta)
                .join("");

        const getResult = (callId: string) =>
            events.find(
                (e): e is Extract<AgentEvent, { type: "tool_result" }> =>
                    e.type === "tool_result" && e.data.callId === callId,
            )?.data.outputPreview;

        return events.map((ev) => {
            if (ev.type !== "output_item.added") return ev;
            return {
                ...ev,
                args: getArgs(ev.data.id),
                result: getResult(ev.data.callId),
            };
        });
    }

    let views = $derived(buildEvents(eventsState.events));

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

<aside class="aw">
    <div class="aw-header">
        <span class="aw-header-title">EVENT LOG</span>
        <span class="aw-header-count">[{eventsState.events.length}]</span>
    </div>

    <div class="aw-screen" bind:this={bodyEl}>
        {#if eventsState.events.length === 0}
            <div class="aw-empty">No events recorded</div>
        {:else}
        {#each views as ev}
        {#if ev.type === "init"}
            <div class="aw-line aw-init">► {ev.data.message}</div>
        {/if}
    
        {#if ev.type === "output_item.added"}
            <div class="aw-line aw-tool">
                ■ TOOL: {ev.data.name}
                <span class="aw-dim">Round {ev.data.toolRound}</span>
            </div>
    
            {#if ev.args}
                <button type="button" class="aw-line aw-file"
                    onclick={() => toggle(`args-${ev.data.id}`)}>
                    {expanded.has(`args-${ev.data.id}`) ? "▾" : "▸"} code.js
                </button>
                {#if expanded.has(`args-${ev.data.id}`)}
                    <div class="aw-code">
                        {@html md.render(`\`\`\`js\n${extractCode(ev.args)}\n\`\`\``).trimEnd()}
                    </div>
                {/if}
            {/if}
    
            {#if ev.result}
                <button type="button" class="aw-line aw-file"
                    onclick={() => toggle(`res-${ev.data.callId}`)}>
                    {expanded.has(`res-${ev.data.callId}`) ? "▾" : "▸"} RESULT.txt
                </button>
                {#if expanded.has(`res-${ev.data.callId}`)}
                    <pre class="aw-detail">{ev.result}</pre>
                {/if}
            {/if}
        {/if}
    
        {#if ev.type === "done"}
            <div class="aw-line aw-done">✓ {ev.data.message}</div>
        {/if}
    
        {#if ev.type === "error"}
            <div class="aw-line aw-error">✕ ERROR: {ev.data.message}</div>
        {/if}
    {/each}
        {/if}
    </div>

    <div class="aw-footer">
        <span>▸ Auto-scroll</span>
        <span>Event Monitor v1.0</span>
    </div>
</aside>
