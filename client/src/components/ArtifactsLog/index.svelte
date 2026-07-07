<script lang="ts">
    import "./styles.css";
    import { eventsState } from "../../store/index.svelte";
    import type { ArtifactRuntimeEvent } from "../../lib/types";

    const runtimeEvents = $derived(
        eventsState.events.filter(
            (event): event is ArtifactRuntimeEvent =>
                event.event === "artifact_read" ||
                event.event === "artifact_created",
        ),
    );

    let openedEntries = $state<Record<string, boolean>>({});
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
                {@const entryKey = `${entry.event}:${entry.data.filePath}:${index}`}
                {@const isOpen = openedEntries[entryKey] ?? false}

                <article class="trace-entry {isOpen ? 'open' : 'collapsed'}">
                    <div class="trace-rail">
                        <span class="trace-node"></span>
                        {#if index < runtimeEvents.length - 1}
                            <span class="trace-line"></span>
                        {/if}
                    </div>

                    <div class="trace-content">
                        <div class="trace-entry-head">
                            <button
                                type="button"
                                class="trace-operation {entry.event ===
                                'artifact_read'
                                    ? 'read'
                                    : 'create'}"
                                aria-expanded={isOpen}
                                onclick={() => openedEntries[entryKey] = !openedEntries[entryKey]}
                            >
                                {entry.event === "artifact_read"
                                    ? "READ"
                                    : "CREATE"}
                            </button>
                        </div>

                        {#if isOpen}
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
                        {/if}
                    </div>
                </article>
            {:else}
                <div class="trace-empty">WAITING FOR ARTIFACTS</div>
            {/each}
        </div>
    </div>
    <footer class="trace-statusbar">
        <span> <span class="trace-status-led"></span> TRACE ACTIVE </span>
        <span>ARTIFACT BUS: OK</span>
    </footer>
</section>
