<script lang="ts">
    import { callAgent } from "../../api/callAgent";
    import type { AgentEvent } from "../../lib/types";
    import { md } from "../../lib/utils/markdown";
    import { eventsState } from "../../store/index.svelte";
    import "./styles.css";

    let approved = $state<Set<string>>(new Set<string>());
    let expanded = $state<Set<string>>(new Set<string>());

    type Status = "idle" | "running" | "paused" | "done" | "error";

    const STATUS_LABELS: Record<Status, string> = {
        idle: "Idle",
        running: "Running",
        paused: "Paused",
        done: "Complete",
        error: "Error",
    };

    let status = $derived.by<Status>(() => {
        const last = eventsState.events.at(-1);

        if (!last) return "idle";
        if (last.type === "error") return "error";
        if (last.type === "pause") return "paused";
        if (last.type === "end") return "done";

        return "running";
    });

    function buildEvents(events: AgentEvent[]) {
        const argsMap = new Map<string, string>();
        const toolCalls = new Map<string, AgentEvent>();
        const results = new Map<string, string>();

        for (const ev of events) {
            if (ev.type === "arguments_delta") {
                argsMap.set(
                    ev.data.id,
                    (argsMap.get(ev.data.id) ?? "") + ev.data.delta,
                );
            }

            if (ev.type === "tool_start") {
                toolCalls.set(ev.data.callId, ev);
            }

            if (ev.type === "tool_result") {
                results.set(ev.data.callId, ev.data.outputPreview ?? "");
            }
        }

        return events.map((ev) => {
            if (ev.type !== "output_item.added") return ev;

            return {
                ...ev,
                args: argsMap.get(ev.data.id),
                toolCall: toolCalls.get(ev.data.callId),
                result: results.get(ev.data.callId),
            };
        });
    }

    let views = $derived(buildEvents(eventsState.events));

    function toggle(set: Set<string>, id: string): Set<string> {
        const next = new Set(set);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    }

    function extractCode(raw: string): string {
        try {
            const parsed = JSON.parse(raw.trim()) as { code?: string };
            return typeof parsed.code === "string" ? parsed.code : raw;
        } catch {
            return raw;
        }
    }
</script>

<aside class="aw">
    <div class="aw-header">
        <span class="aw-header-title">EVENT LOG</span>
        <span class="aw-header-count">[{eventsState.events.length}]</span>
    </div>

    <div class="aw-screen">
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
                        <!-- <span class="aw-dim">Round {ev.data.toolRound}</span> -->
                    </div>

                    {#if ev.args}
                        <button
                            type="button"
                            class="aw-line aw-file"
                            onclick={() =>
                                (expanded = toggle(
                                    expanded,
                                    `args-${ev.data.id}`,
                                ))}
                        >
                            {expanded.has(`args-${ev.data.id}`) ? "▾" : "▸"} code.js
                        </button>
                        {#if expanded.has(`args-${ev.data.id}`)}
                            <div class="aw-code">
                                {@html md
                                    .render(
                                        `\`\`\`js\n${extractCode(ev.args)}\n\`\`\``,
                                    )
                                    .trimEnd()}
                            </div>
                        {/if}
                    {/if}

                    {#if !ev.result && eventsState.events.at(-1)?.type === "pause"}
                        <div class="aw-actions">
                            <button
                                type="button"
                                class={`aw-btn aw-btn-approve ${approved.has(ev.data.callId) ? "active" : ""}`}
                                onclick={() =>
                                    (approved = toggle(
                                        approved,
                                        ev.data.callId,
                                    ))}
                            >
                                {approved.has(ev.data.callId)
                                    ? "APPROVED"
                                    : "APPROVE"}
                            </button>
                        </div>
                    {/if}

                    {#if ev.result}
                        <button
                            type="button"
                            class="aw-line aw-file"
                            onclick={() =>
                                (expanded = toggle(
                                    expanded,
                                    `res-${ev.data.callId}`,
                                ))}
                        >
                            {expanded.has(`res-${ev.data.callId}`) ? "▾" : "▸"} RESULT.txt
                        </button>
                        {#if expanded.has(`res-${ev.data.callId}`)}
                            <pre class="aw-detail">{ev.result}</pre>
                        {/if}
                    {/if}
                {/if}

                {#if ev.type === "end"}
                    <div class="aw-line aw-done">✓ {ev.data.message}</div>
                {/if}

                {#if ev.type === "pause"}
                    <div class="aw-pause">
                        <div class="aw-line aw-pause-title">‖ PAUSED</div>
                        <div class="aw-line aw-pause-reason">
                            Reason: <span>{ev.data.reason}</span>
                        </div>

                        <button
                            type="button"
                            class={`aw-resume ${approved.size === 0 ? "aw-resume-back" : "aw-resume-run"}`}
                            onclick={() => {
                                const toolResultIds = new Set(
                                    eventsState.events
                                        .filter(
                                            (ev) => ev.type === "tool_result",
                                        )
                                        .map((ev) => ev.data.callId),
                                );

                                const keepCall = (callId: string) =>
                                    toolResultIds.has(callId) ||
                                    approved.has(callId);

                                eventsState.events = eventsState.events.filter(
                                    (ev) => {
                                        if (ev.type === "pause") return false;

                                        if (
                                            ev.type === "tool_start" ||
                                            ev.type === "output_item.added"
                                        ) {
                                            return keepCall(ev.data.callId);
                                        }

                                        if (ev.type === "arguments_delta") {
                                            const added =
                                                eventsState.events.find(
                                                    (e) =>
                                                        e.type ===
                                                            "output_item.added" &&
                                                        e.data.id ===
                                                            ev.data.id,
                                                );

                                            return added?.type !==
                                                "output_item.added"
                                                ? true
                                                : keepCall(added.data.callId);
                                        }

                                        return true;
                                    },
                                );

                                callAgent({ toolCallIds: [...approved] });
                                approved = new Set();
                            }}
                        >
                            {approved.size === 0
                                ? "BACK"
                                : `Resume [${approved.size}]`}
                        </button>
                    </div>
                {/if}

                {#if ev.type === "error"}
                    <div class="aw-line aw-error">
                        ✕ ERROR: {ev.data.message}
                    </div>
                {/if}
            {/each}
        {/if}
    </div>

    <div class="aw-footer">
        <span class={`aw-status aw-status-${status}`}>
            {STATUS_LABELS[status]}
        </span>
        <span>Event Monitor v1.0</span>
    </div>
</aside>
