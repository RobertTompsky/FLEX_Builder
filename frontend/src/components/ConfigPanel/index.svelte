<script lang="ts">
    import { onMount } from "svelte";
    import { agentState } from "../../store/index.svelte";
    import "./styles.css";
    import z from "zod";

    const InfoResponseSchema = z.object({
        skills: z.array(z.string()),
        models: z.array(z.string()),
    });

    let {
        skills,
        models,
    }: {
        skills: z.infer<typeof InfoResponseSchema>["skills"];
        models: z.infer<typeof InfoResponseSchema>["models"];
    } = $state({ skills: [], models: [] });

    let infoError = $state<string | null>(null);
    let loading = $state(true);

    onMount(async () => {
        try {
            const res = await fetch("http://localhost:3000/info");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = InfoResponseSchema.parse(await res.json());

            skills = data.skills;
            models = data.models;
        } catch (e) {
            console.error("Failed to load /info", e);
            infoError = "Failed to load agent options (server offline)";
        } finally {
            loading = false;
        }
    });
</script>

<aside class="config-window">
    <div class="window-head">CONFIG</div>

    <div class="window-body-inner">
        <form class="config-form">
            <label class="config-field">
                <span>Agent name</span>
                <input
                    type="text"
                    bind:value={agentState.name}
                    placeholder="default-agent"
                />
            </label>

            <label class="config-field">
                <span>Model</span>

                <select
                    bind:value={agentState.model}
                    disabled={loading || models.length === 0}
                >
                    <option value="">
                        {#if loading}
                            Loading models…
                        {:else if models.length === 0}
                            No models available
                        {:else}
                            Select model
                        {/if}
                    </option>

                    {#if models.length > 0}
                        {#each models as model}
                            <option value={model}>{model}</option>
                        {/each}
                    {/if}
                </select>
            </label>

            <label class="config-field">
                <span>Skills</span>

                <div class="skills">
                    {#if loading}
                        <span class="hint">Loading skills…</span>
                    {:else if skills.length === 0}
                        <span class="hint">No skills available</span>
                    {:else}
                        {#each skills as skill}
                            <button
                                type="button"
                                class="skill-chip"
                                class:active={agentState.skills.includes(skill)}
                                onclick={() => {
                                    const set = new Set(agentState.skills);
                                    set.has(skill)
                                        ? set.delete(skill)
                                        : set.add(skill);
                                    agentState.skills = [...set];
                                }}
                            >
                                {skill}
                            </button>
                        {/each}
                    {/if}
                </div>
            </label>

            <label class="config-field">
                <span>System prompt</span>
                <textarea bind:value={agentState.prompt} rows="4">
                    You are a helpful agent.
                </textarea>
            </label>

            {#if infoError}
                <div class="config-error">
                    ⚠ {infoError}
                </div>
            {/if}
        </form>
    </div>
</aside>
