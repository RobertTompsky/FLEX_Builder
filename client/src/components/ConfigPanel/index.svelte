<script lang="ts">
    import { agentState, infoState } from "../../store/index.svelte";
    import "./styles.css";
</script>

<aside class="bios">
    <div class="bios-header">
        <span class="bios-logo">▐█▌</span>
        <span class="bios-title">SETUP UTILITY</span>
        <span class="bios-ver">v2.2.8</span>
    </div>

    <div class="bios-body">
        <div class="bios-section">
            <div class="bios-row">
                <span class="bios-label">Agent Name</span>
                <input
                    type="text"
                    class="bios-input"
                    bind:value={agentState.name}
                    placeholder="default-agent"
                />
            </div>

            <div class="bios-row">
                <span class="bios-label">Model</span>
                <select
                    class="bios-select"
                    bind:value={agentState.model}
                    disabled={infoState.loading || infoState.models.length === 0}
                >
                    <option value="">
                        {#if infoState.loading}
                            Loading...
                        {:else if infoState.models.length === 0}
                            N/A
                        {:else}
                            [Select]
                        {/if}
                    </option>
                    {#if infoState.models.length > 0}
                        {#each infoState.models as model}
                            <option value={model}>{model}</option>
                        {/each}
                    {/if}
                </select>
            </div>

            <div class="bios-row">
                <span class="bios-label">Tool Rounds</span>
                <input
                    type="number"
                    class="bios-input"
                    bind:value={agentState.toolRounds}
                    min="1"
                    max="10"
                    placeholder="3"
                />
            </div>

            <div class="bios-divider"></div>

            <div class="bios-row col">
                <span class="bios-label">Skills</span>
                <div class="bios-skills">
                    {#if infoState.loading}
                        <span class="bios-hint">Scanning...</span>
                    {:else if infoState.skills.length === 0}
                        <span class="bios-hint">No skills detected</span>
                    {:else}
                        {#each infoState.skills as skill}
                            <button
                                type="button"
                                class="bios-chip"
                                class:active={agentState.skills.includes(skill)}
                                onclick={() => {
                                    const set = new Set(agentState.skills);
                                    set.has(skill)
                                        ? set.delete(skill)
                                        : set.add(skill);
                                    agentState.skills = [...set];
                                }}
                            >
                                <span class="bios-chip-indicator"
                                    >{agentState.skills.includes(skill)
                                        ? "■"
                                        : "□"}</span
                                >
                                {skill}
                            </button>
                        {/each}
                    {/if}
                </div>
            </div>

            <div class="bios-divider"></div>

            <div class="bios-row col">
                <span class="bios-label">System Prompt</span>
                <textarea
                    class="bios-textarea"
                    bind:value={agentState.prompt}
                    rows="3"
                    placeholder="You are a helpful agent."
                ></textarea>
            </div>

            {#if infoState.error}
                <div class="bios-error">
                    !! {infoState.error}
                </div>
            {/if}
        </div>
    </div>

    <div class="bios-footer">
        <span>ESC: Exit</span>
        <span>F10: Save</span>
        <span>↑↓: Select</span>
    </div>
</aside>
