import ReactMarkdown from "react-markdown";
import {
    Prism as SyntaxHighlighter,
} from "react-syntax-highlighter";
import {
    atomDark,
    // coldarkDark,
    // dracula,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import styles from "./styles.module.scss";
import type { UIMessage } from "../../../shared/types/agent";

export function Message({
    role,
    content,
    status,
}: UIMessage) {
    const tag =
        role === "user"
            ? "C/USERS/USER>"
            : "ASSISTANT>";

    return (
        <div
            className={[
                styles.message,
                styles[role],
            ]
                .filter(Boolean)
                .join(" ")}
            data-status={status}
        >
            <div className={styles.text}>
                <span className={styles.tag}>
                    {tag}
                </span>{" "}

                <ReactMarkdown
                    components={{
                        code({
                            className,
                            children,
                            ...props
                        }) {
                            const match =
                                /language-(\w+)/.exec(
                                    className ?? "",
                                );

                            if (match) {
                                return (
                                    <SyntaxHighlighter
                                        language={match[1]}
                                        style={atomDark}
                                        customStyle={{
                                            margin: "6px 0",
                                            padding: "10px 12px",

                                            border: "1px solid #222",
                                            borderLeft: "3px solid #4444aa",

                                            borderRadius: "0",

                                            background: "#050505",
                                        }}
                                    >
                                        {String(children)
                                            .replace(/\n$/, "")}
                                    </SyntaxHighlighter>
                                );
                            }

                            return (
                                <code
                                    className={className}
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        },
                    }}
                >
                    {content ?? ""}
                </ReactMarkdown>
            </div>
        </div>
    );
}