<script lang="ts">
  import "highlight.js/styles/atom-one-dark-reasonable.min.css";
  import { md } from "../../lib/utils/markdown";
  import type { MessageProps } from "../../lib/types";
  import "./styles.css";

  let props: MessageProps = $props();

  const rendered = $derived(() => {
    const html = md.render(props.content).trimEnd();

    // 🔥 убираем пустые абзацы
    return html;
  });
  let promptLabel = $derived(
    props.role === "user" ? "C:\\Users\\User> " : "ASSISTANT> ",
  );
</script>

<div class="msg {props.role}" data-status={props.status}>
  <!-- <div class="text-line"> -->
  <span class="prompt">{promptLabel}</span>
  <span class="msg-text">
    {@html rendered()}

  </span>
  <!-- </div> -->
</div>
