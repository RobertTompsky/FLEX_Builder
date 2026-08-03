<script lang="ts">
  import type {
    Snippet,
  } from "svelte";

  import AgentsSidebar from "../components/AgentsSidebar/index.svelte";
    import { mockAgents } from "../data/mockAgent";

  let {
    children,
  }: {
    children: Snippet;
  } = $props();
</script>

<div class="workspace">
  <header class="workspace__titlebar">
    <div class="workspace__title">
      <span class="workspace__app-icon">▣</span>
      <span>AGENT WORKSPACE</span>
    </div>

    <div class="workspace__controls">
      <button type="button" aria-label="Minimize">—</button>
      <button type="button" aria-label="Maximize">□</button>
      <button type="button" aria-label="Close">×</button>
    </div>
  </header>

  <nav class="workspace__menu">
    <button type="button">File</button>
    <button type="button">View</button>
    <button type="button">Tools</button>
    <button type="button">Window</button>
    <button type="button">Help</button>
  </nav>

  <div class="workspace__body">
    <AgentsSidebar agents={mockAgents} />

    <main class="workspace__content">
      {@render children()}
    </main>
  </div>

  <footer class="workspace__statusbar">
    <div class="workspace__status">
      <span class="workspace__status-light"></span>
      READY
    </div>

    <div>WORKSPACE: DEFAULT</div>

    <div class="workspace__status-spacer"></div>

    <div>{mockAgents.length} AGENTS</div>
    <div>BUILD 1.0.0</div>
  </footer>
</div>