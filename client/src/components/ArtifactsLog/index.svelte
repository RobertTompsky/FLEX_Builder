<script lang="ts">
    import "./styles.css";
    import { eventsState } from "../../store/index.svelte";
    import type { RuntimeEvent } from "../../lib/types";
    const runtimeEvents = $derived(
        eventsState.events.filter(
            (event): event is RuntimeEvent =>
                event.event === "artifact_read" ||
                event.event === "artifact_created",
        ),
    );
    function getOperation(event: RuntimeEvent) {
        return event.event === "artifact_read" ? "READ" : "CREATE";
    }
    function getOperationClass(event: RuntimeEvent) {
        return event.event === "artifact_read" ? "read" : "create";
    }
</script>

<section class="artifact-trace">
    <header class="trace-titlebar">
        <div class="trace-title">
            <span class="trace-led" aria-hidden="true"></span> ARTIFACTS
        </div>
        <span class="trace-count">
            {String(runtimeEvents.length).padStart(3, "0")}
        </span>
    </header>
    <div class="trace-toolbar">
        <span>SYSTEM / ARTIFACT</span> <span>REC ●</span>
    </div>
    <div class="trace-screen">
        <div class="trace-list">
            {#each runtimeEvents as entry, index}
                <article class="trace-entry">
                    <div class="trace-rail">
                        <span class="trace-node"></span>
                        {#if index < runtimeEvents.length - 1}
                            <span class="trace-line"></span>
                        {/if}
                    </div>
                    <div class="trace-content">
                        <div class="trace-entry-head">
                            <span
                                class="trace-operation {getOperationClass(
                                    entry,
                                )}"
                            >
                                {getOperation(entry)}
                            </span>
                        </div>
                        <div class="trace-path">
                            <span class="trace-arrow" aria-hidden="true">
                                ›
                            </span>
                            {entry.data.filePath}
                        </div>
                        <p>{entry.data.report}</p>
                        {#if entry.event === "artifact_created" && entry.data.description}
                            <span class="trace-description">
                                {entry.data.description}
                            </span>
                        {/if}
                    </div>
                </article>
            {:else}
                <div class="trace-empty">WAITING FOR ARTIFACTS...</div>
            {/each}
        </div>
    </div>
    <footer class="trace-statusbar">
        <span> <span class="trace-status-led"></span> TRACE ACTIVE </span>
        <span>ARTIFACT BUS: OK</span>
    </footer>
</section>
