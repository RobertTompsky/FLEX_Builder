<script lang="ts">
  import ConfigPanel from "./components/ConfigPanel/index.svelte";
  import EventsPanel from "./components/EventsPanel/index.svelte";
  import Chat from "./components/Chat/index.svelte";
</script>

<div class="app">
  <Chat />

  <div class="right-panel">
    <ConfigPanel />
    <EventsPanel />
  </div>
</div>
