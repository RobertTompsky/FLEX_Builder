<script lang="ts">
  import { onMount } from "svelte";
  import { agentState, infoState } from "./store/index.svelte";
  import ConfigPanel from "./components/ConfigPanel/index.svelte";
  import EventsPanel from "./components/EventsPanel/index.svelte";
  import Chat from "./components/Chat/index.svelte";
  import type { UIMessage } from "./lib/types";

  onMount(async () => {
    try {
      const res = await fetch("http://localhost:3000/info");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as {
        skills: string[];
        models: string[];
        uiHistory: UIMessage[];
      };

      infoState.skills = data.skills;
      infoState.models = data.models;
      agentState.messages = data.uiHistory;

      if (!agentState.model && data.models.length > 0) {
        agentState.model = data.models[0];
      }
    } catch (e) {
      console.error("Failed to load /info", e);
      infoState.error = "Failed to load agent options (server offline)";
    } finally {
      infoState.loading = false;
    }
  });
</script>

<div class="app">
  <Chat />
  <div class="right-panel">
    <ConfigPanel />
    <EventsPanel />
  </div>
</div>
