<script lang="ts">
    import { isActiveLink } from "sv-router";
    import type { AgentSummary } from "../../data/mockAgent";


    import "./AgentsSidebar.scss";

    let {
        agents,
    }: {
        agents: AgentSummary[];
    } = $props();

    const createAgent = async () => {
        // Пока без формы создания.
        // Позже здесь откроется /agents/new или отдельное окно.
        console.log("Create new agent");
    };
</script>

<aside class="agents-sidebar">
    <header class="agents-sidebar__header">
        <span>AGENTS</span>
        <span class="agents-sidebar__counter">
            {agents.length}
        </span>
    </header>

    <button class="agents-sidebar__new" type="button" onclick={createAgent}>
        <span class="agents-sidebar__new-icon">▤</span>
        NEW AGENT
    </button>

    <div class="agents-sidebar__content">
        {#if agents.length === 0}
            <div class="agents-sidebar__empty">
                <div class="agents-sidebar__empty-copy">
                    <p>No agents created.</p>
                    <p>Your workspace is empty.</p>
                </div>

                <div class="agents-sidebar__empty-robot" aria-hidden="true">
                    <div class="agents-sidebar__antenna"></div>
                    <div class="agents-sidebar__robot-head">
                        <span></span>
                        <span></span>
                    </div>
                    <div class="agents-sidebar__robot-body">
                        <span></span>
                    </div>
                </div>

                <div class="agents-sidebar__empty-copy">
                    <p>Get started by creating</p>
                    <p>your first agent.</p>
                </div>
            </div>
        {:else}
            <nav class="agents-sidebar__list">

            </nav>
        {/if}
    </div>

    <button
        class="agents-sidebar__templates"
        type="button"
    >
        <span>▰</span>
        AGENT TEMPLATES
    </button>
</aside>
