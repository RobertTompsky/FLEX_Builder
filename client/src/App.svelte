<script lang="ts">
  import { Router } from "sv-router";

  import "./router";
  import "./app.scss";

  import WorkspaceLayout from "./layouts/WorkspaceLayout.svelte";
</script>

<WorkspaceLayout>
  <Router />
</WorkspaceLayout>
