import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark-reasonable.min.css";

export const md = MarkdownIt({
    html: false,
    linkify: true,
    breaks: false,
    typographer: false,

    highlight(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return `<pre><code class="hljs language-${lang}">${hljs.highlight(code, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
        }

        const auto = hljs.highlightAuto(code);

        return `<pre><code class="hljs ${auto.language ? "language-" + auto.language : ""}">${auto.value}</code></pre>`;
    },
});

