<script lang="ts">
    import {
        callAgent,
        processToolCalls,
        stopAgent,
    } from "../../api/callAgent";
    import type { AgentEvent, AppEvent } from "../../lib/types";
    import { md } from "../../lib/utils/markdown";
    import {
        eventsState,
        agentState
    } from "../../store/index.svelte";
    import "./styles.css";

    let approved = $state<Set<string>>(new Set<string>());
    let expanded = $state<Set<string>>(new Set<string>());

    type Status = "idle" | "running" | "paused" | "done" | "error" | "stopped";

    const STATUS_LABELS: Record<Status, string> = {
        idle: "Idle",
        running: "Running",
        paused: "Paused",
        done: "Complete",
        error: "Error",
        stopped: "Stopped",
    };

    let status = $derived.by<Status>(() => {
        const last = eventsState.events.at(-1);

        if (!last) return "idle";
        if (last.event === "error") return "error";
        if (last.event === "pause") return "paused";
        if (last.event === "stop") return "stopped";
        if (last.event === "end") return "done";

        return "running";
    });

    function buildEvents(events: AppEvent[]) {
        const argsMap = new Map<string, string>();
        const toolCalls = new Map<string, AgentEvent>();
        const results = new Map<string, string>();

        for (const ev of events) {
            if (ev.event === "arguments_delta") {
                argsMap.set(
                    ev.data.id,
                    (argsMap.get(ev.data.id) ?? "") + ev.data.delta,
                );
            }

            if (ev.event === "tool_start") {
                toolCalls.set(ev.data.callId, ev);
            }

            if (ev.event === "tool_result") {
                results.set(ev.data.callId, ev.data.outputPreview ?? "");
            }
        }

        return events.map((ev) => {
            if (ev.event !== "output_item.added") return ev;

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
                <!-- {#if ev.event === "upload_start"}
                    <div class="aw-line aw-upload">
                        UPLOAD: {ev.data.name}
                    </div>
                {/if}

                {#if ev.event === "upload_done"}
                    <div class="aw-line aw-upload-done">
                        UPLOADED: {ev.data.filename}
                    </div>
                {/if} -->
                {#if ev.event === "init"}
                    <div class="aw-line aw-init">{ev.data.message}</div>
                {/if}

                {#if ev.event === "output_item.added"}
                    <div class="aw-line aw-tool">
                        TOOL: {ev.data.name}
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

                    {#if !ev.result && eventsState.events.at(-1)?.event === "pause"}
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

                {#if ev.event === "end"}
                    <div class="aw-line aw-done">{ev.data.message}</div>
                {/if}

                {#if ev.event === "pause"}
                    <div class="aw-pause">
                        <div class="aw-line aw-pause-title">‖ PAUSED</div>
                        <div class="aw-line aw-pause-reason">
                            Reason: <span>{ev.data.reason}</span>
                        </div>

                        <div class="aw-pause-controls">
                            <button
                                type="button"
                                class={`aw-resume ${approved.size === 0 ? "aw-resume-back" : "aw-resume-run"}`}
                                onclick={async () => {
                                    const ids = [...approved];

                                    const toolResultIds = new Set(
                                        eventsState.events
                                            .filter(
                                                (ev) =>
                                                    ev.event === "tool_result",
                                            )
                                            .map((ev) => ev.data.callId),
                                    );

                                    const keepCall = (callId: string) =>
                                        toolResultIds.has(callId) ||
                                        approved.has(callId);

                                    eventsState.events =
                                        eventsState.events.filter((ev) => {
                                            if (ev.event === "pause")
                                                return false;

                                            if (
                                                ev.event === "tool_start" ||
                                                ev.event === "output_item.added"
                                            ) {
                                                return keepCall(ev.data.callId);
                                            }

                                            if (
                                                ev.event === "arguments_delta"
                                            ) {
                                                const added =
                                                    eventsState.events.find(
                                                        (e) =>
                                                            e.event ===
                                                                "output_item.added" &&
                                                            e.data.id ===
                                                                ev.data.id,
                                                    );

                                                return added?.event !==
                                                    "output_item.added"
                                                    ? true
                                                    : keepCall(
                                                          added.data.callId,
                                                      );
                                            }

                                            return true;
                                        });

                                    await processToolCalls(ids);

                                    approved = new Set();

                                    await callAgent({ query: null });
                                }}
                            >
                                {approved.size === 0
                                    ? "BACK"
                                    : `Resume [${approved.size}]`}
                            </button>

                            <button
                                type="button"
                                class="aw-stop-button"
                                onclick={async () => {
                                    await stopAgent(agentState.runId!);
                                    approved = new Set();
                                }}
                            >
                                STOP
                            </button>
                        </div>
                    </div>
                {/if}

                {#if ev.event === "stop"}
                    <div class="aw-stop">
                        <div class="aw-line aw-stop-title">STOP</div>
                        <div class="aw-line aw-stop-reason">
                            Reason: <span>{ev.data.reason}</span>
                        </div>
                    </div>
                {/if}

                {#if ev.event === "error"}
                    <div class="aw-line aw-error">
                        ERROR: {ev.data.message}
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
