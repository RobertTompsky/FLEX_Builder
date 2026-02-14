<script lang="ts">
  import "highlight.js/styles/atom-one-dark-reasonable.min.css";
  import { md } from "../../lib/utils/markdown";
  import type { UIMessage } from "../../lib/types";
  import "./styles.css";

  let props: UIMessage = $props();

  const rendered = $derived(() => md.render(props.content).trimEnd());

  let tag = $derived(props.role === "user" ? "С/USERS/USER:" : "ASSISTANT:");
</script>

<div class="msg {props.role}" data-status={props.status}>
  <span class="msg-tag">{tag}</span>
  <div class="msg-text">
    {@html rendered()}
  </div>
</div>
