<script lang="ts">
  import "highlight.js/styles/atom-one-dark-reasonable.min.css";
  import { md } from "../../lib/utils/markdown";
  import type { UIMessage } from "../../lib/types";
  import "./styles.css";

  let props: UIMessage = $props();

  let tag = $derived(props.role === "user" ? "С/USERS/USER>" : "ASSISTANT>");

  const rendered = $derived(() => {
    const raw = md.render(props.content ?? "").trimEnd();
    const safe = raw || "<p></p>";
    const tagHtml = `<span class="msg-tag">${tag}</span> `;
    return safe
      .replace(/^(<(?:p|ol|ul|li|h[1-6]|div|blockquote)[^>]*>)/, `$1${tagHtml}`)
      .trimEnd();
  });
</script>

<div
  class="msg {props.role} {props.status === 'in_progress' ? 'in_progress' : ''}"
  data-status={props.status}
>
  <div class="msg-text">
    {@html rendered()}
  </div>
</div>
