import {
    Prism as SyntaxHighlighter,
} from "react-syntax-highlighter";

import {
    atomDark,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import ReactMarkdown from "react-markdown";

import {
    js as beautifyJs,
} from "js-beautify";

import type {
    AgentSSEMessage,
} from "@flex-builder/shared/agent";

import type {
    ArtifactView,
    EventView,
    ExecutionView,
    SubagentToolView,
    SubagentView,
    ToolView,
} from "./buildEventViews";

import styles from "./styles.module.scss";

function cx(
    ...classes:
        Array<
            string
            | false
            | null
            | undefined
        >
): string {
    return classes
        .filter(Boolean)
        .join(" ");
}


function decodePartialJsonString(
    value: string
): string {
    let result = "";

    for (
        let index = 0;
        index < value.length;
        index++
    ) {
        const char = value[index];

        if (char === '"') {
            break;
        }

        if (char !== "\\") {
            result +=
                char;

            continue;
        }

        const next = value[index + 1];

        if (next === undefined) {
            break;
        }

        switch (next) {
            case "n":
                result += "\n";
                break;

            case "r":
                result += "\r";
                break;

            case "t":
                result += "\t";
                break;

            case '"':
                result += '"';
                break;

            case "\\":
                result += "\\";
                break;

            default:
                result += next;
        }

        index++;
    }

    return result;
}


function extractStreamingCode(
    raw: string,
): string | null {
    const match =
        /"code"\s*:\s*"/
            .exec(raw);

    if (
        !match ||
        match.index ===
        undefined
    ) {
        return null;
    }

    const start =
        match.index +
        match[0].length;

    return decodePartialJsonString(
        raw.slice(
            start,
        ),
    );
}


function extractCode(
    raw: string,
): string {
    try {
        const parsed = JSON.parse(
            raw.trim(),
        ) as {
            code?: unknown;
        };

        return typeof
            parsed.code ===
            "string"
            ? parsed.code
            : raw;
    } catch {
        return (
            extractStreamingCode(raw) ?? raw
        );
    }
}


function formatCode(
    raw: string,
): string {
    return beautifyJs(
        extractCode(
            raw,
        ),
        {
            indent_size: 2,
            wrap_line_length: 60,
            preserve_newlines: true,
        },
    );
}

function tryFormatJson(
    value: string,
): string | null {
    try {
        const parsed =
            JSON.parse(value);

        if (
            typeof parsed === "object" &&
            parsed !== null &&
            !Array.isArray(parsed) &&
            "stdout" in parsed &&
            typeof parsed.stdout === "string"
        ) {
            const stdout =
                parsed.stdout.trim();

            try {
                const result =
                    JSON.parse(stdout);

                return JSON.stringify(
                    result,
                    null,
                    2,
                );
            } catch {
                return JSON.stringify(
                    parsed,
                    null,
                    2,
                );
            }
        }

        return JSON.stringify(
            parsed,
            null,
            2,
        );
    } catch {
        return null;
    }
}


function CodeBlock({
    code,
}: {
    code: string;
}) {
    return (
        <div
            className={styles.code}
        >
            <SyntaxHighlighter
                language="typescript"
                style={
                    atomDark
                }
                customStyle={{
                    margin: 0,
                    padding: "6px 8px",
                    background: "transparent",
                    fontSize: "10px",
                    lineHeight: 1.4,
                }}
                codeTagProps={{
                    style: {
                        fontFamily: 'Consolas, "Courier New", monospace',
                    },
                }}
            >
                {
                    formatCode(code)
                }
            </SyntaxHighlighter>
        </div>
    );
}


function ResultBlock({
    result,
}: {
    result: string;
}) {
    const formattedJson = tryFormatJson(result);

    return (
        <details
            className={styles.expandable}
        >
            <summary
                className={styles.file}
            >
                RESULT.txt
            </summary>

            {formattedJson !== null ? (
                <div
                    className={
                        styles.resultCode
                    }
                >
                    <SyntaxHighlighter
                        language="json"
                        style={
                            atomDark
                        }
                        customStyle={{
                            margin: 0,
                            padding:
                                "6px 8px",
                            background:
                                "transparent",
                            fontSize:
                                "10px",
                            lineHeight:
                                1.5,
                        }}
                    >
                        {formattedJson}
                    </SyntaxHighlighter>
                </div>
            ) : (
                <pre
                    className={
                        styles.detail
                    }
                >
                    {
                        result ||
                        "[empty result]"
                    }
                </pre>
            )}
        </details>
    );
}


function ErrorBlock({
    message,
}: {
    message: string;
}) {
    return (
        <div
            className={
                styles.subagentError
            }
        >
            ERROR:{" "}
            {message}
        </div>
    );
}


function ArtifactBlock({
    view,
}: {
    view: ArtifactView;
}) {
    const {
        event,
    } = view;

    const created =
        event.event ===
        "artifact_created";

    const {
        filePath,
        report,
    } =
        event.data.data;

    return (
        <div
            className={
                styles.nestedEvent
            }
        >
            <div
                className={cx(
                    styles.line,
                    styles.artifact,
                )}
            >
                {
                    created
                        ? "ARTIFACT CREATED"
                        : "ARTIFACT READ"
                }
            </div>

            <div
                className={
                    styles.nestedMeta
                }
            >
                {filePath}
            </div>

            <details
                className={
                    styles.nestedDetails
                }
            >
                <summary>
                    report.txt
                </summary>

                <pre
                    className={
                        styles.detail
                    }
                >
                    {report}
                </pre>
            </details>
        </div>
    );
}


function ExecutionBlock({
    view,
}: {
    view: ExecutionView;
}) {
    const {
        event,
    } = view;

    switch (event.event) {
        case "started":
            return (
                <div
                    className={
                        styles.nestedEvent
                    }
                >
                    <div
                        className={
                            styles.line
                        }
                    >
                        EXECUTION STARTED
                    </div>

                    <div
                        className={
                            styles.nestedMeta
                        }
                    >
                        PID:{" "}
                        {
                            event
                                .data
                                .data
                                .pid
                        }
                    </div>
                </div>
            );

        case "exit":
            return (
                <div
                    className={
                        styles.nestedEvent
                    }
                >
                    <div
                        className={
                            styles.line
                        }
                    >
                        EXECUTION EXIT
                    </div>

                    <div
                        className={
                            styles.nestedMeta
                        }
                    >
                        CODE:{" "}
                        {
                            String(
                                event
                                    .data
                                    .data
                                    .exitCode,
                            )
                        }
                    </div>
                </div>
            );

        case "timeout":
            return (
                <ErrorBlock
                    message={
                        `Execution timed out after ${event
                            .data
                            .data
                            .timeoutMs
                        } ms`
                    }
                />
            );

        case "output_exceeded":
            return (
                <ErrorBlock
                    message={
                        `Output exceeded ${event
                            .data
                            .data
                            .maxOutputBytes
                        } bytes`
                    }
                />
            );

        case "rpc_trace": {
            const {
                phase,
                method,
                client,
                server,
            } = event.data.data;

            const executeLabel = method === "execute"
                ? `${event.data.data.capability}.${event.data.data.action}`
                : null;

            return (
                <div
                    className={
                        styles.nestedEvent
                    }
                >
                    <div
                        className={
                            styles.line
                        }
                    >
                        RPC{" "}
                        {
                            phase
                                .toUpperCase()
                        }
                    </div>

                    <div
                        className={
                            styles.nestedMeta
                        }
                    >
                        {client}
                        {" → "}
                        {server}
                        {" · "}
                        {method}

                        {executeLabel && (
                            <>
                                {" · "}
                                {executeLabel}
                            </>
                        )}
                    </div>
                </div>
            );
        }
    }
}


function SubagentToolBlock({
    view,
}: {
    view: SubagentToolView;
}) {
    return (
        <div
            className={
                styles.subagentTool
            }
        >
            <div
                className={
                    styles.subagentToolTitle
                }
            >
                TOOL:{" "}
                {view.name}
            </div>

            {view.args && (
                <details
                    className={
                        styles.expandable
                    }
                >
                    <summary
                        className={
                            styles.file
                        }
                    >
                        code.js
                    </summary>

                    <CodeBlock
                        code={
                            view.args
                        }
                    />
                </details>
            )}

            {
                view.error &&
                (
                    <ErrorBlock
                        message={
                            view.error
                        }
                    />
                )
            }

            {
                view.result !==
                undefined &&
                (
                    <ResultBlock
                        result={
                            view.result
                        }
                    />
                )
            }
        </div>
    );
}


function SubagentBlock({
    view,
}: {
    view: SubagentView;
}) {
    return (
        <div
            className={
                styles.subagentBlock
            }
        >
            <div
                className={cx(
                    styles.line,
                    styles.subagent,
                )}
            >
                SUBAGENT:{" "}
                {
                    view
                        .subagent
                        .name
                }
            </div>

            <div
                className={
                    styles.nestedMeta
                }
            >
                {view.runId}
            </div>

            {
                view.tools.map(
                    (tool) => (
                        <SubagentToolBlock
                            key={
                                tool.callId
                            }
                            view={
                                tool
                            }
                        />
                    ),
                )
            }

            {view.response && (
                <details
                    className={
                        styles.expandable
                    }
                    open={
                        view.responseStatus ===
                        "in_progress"
                    }
                >
                    <summary
                        className={
                            styles.file
                        }
                    >
                        RESPONSE.md
                    </summary>

                    <div
                        className={cx(
                            styles.response,

                            view.responseStatus ===
                            "in_progress" &&
                            styles.responseStreaming,

                            view.responseStatus ===
                            "incomplete" &&
                            styles.responseIncomplete,
                        )}
                    >
                        <ReactMarkdown>
                            {
                                view.response
                            }
                        </ReactMarkdown>
                    </div>
                </details>
            )}
        </div>
    );
}


function ToolBlock({
    view,
}: {
    view: ToolView;
}) {
    return (
        <div
            className={
                styles.toolBlock
            }
        >
            <div
                className={cx(
                    styles.line,
                    styles.tool,
                )}
            >
                TOOL:{" "}
                {view.name}
            </div>

            {view.args && (
                <details
                    className={
                        styles.expandable
                    }
                    open
                >
                    <summary
                        className={
                            styles.file
                        }
                    >
                        code.js
                    </summary>

                    <CodeBlock
                        code={
                            view.args
                        }
                    />
                </details>
            )}

            {
                view.nested.length >
                0 &&
                (
                    <div
                        className={
                            styles.nested
                        }
                    >
                        {
                            view.nested.map(
                                (
                                    nested,
                                ) => {
                                    switch (
                                    nested.kind
                                    ) {
                                        case "artifact":
                                            return (
                                                <ArtifactBlock
                                                    key={
                                                        `${nested.order}-${nested.event.event}`
                                                    }
                                                    view={
                                                        nested
                                                    }
                                                />
                                            );

                                        case "execution":
                                            return (
                                                <ExecutionBlock
                                                    key={
                                                        `${nested.order}-${nested.event.event}`
                                                    }
                                                    view={
                                                        nested
                                                    }
                                                />
                                            );

                                        case "subagent":
                                            return (
                                                <SubagentBlock
                                                    key={
                                                        nested.runId
                                                    }
                                                    view={
                                                        nested
                                                    }
                                                />
                                            );
                                    }
                                },
                            )
                        }
                    </div>
                )
            }

            {
                view.error &&
                (
                    <ErrorBlock
                        message={
                            view.error
                        }
                    />
                )
            }

            {
                view.result !==
                undefined &&
                (
                    <ResultBlock
                        result={
                            view.result
                        }
                    />
                )
            }
        </div>
    );
}


function BaseEvent({
    event,
}: {
    event: AgentSSEMessage;
}) {
    switch (event.event) {
        case "status": {
            const {
                runId,
                status,
                reason,
            } =
                event.data.data;

            return (
                <div
                    className={
                        styles.line
                    }
                >
                    RUN:{" "}
                    {
                        status
                            .toUpperCase()
                    }

                    <span
                        className={
                            styles.dim
                        }
                    >
                        {" "}
                        {runId}
                    </span>

                    {reason && (
                        <div>
                            {reason}
                        </div>
                    )}
                </div>
            );
        }

        case "llm_error":
            return (
                <ErrorBlock
                    message={
                        event
                            .data
                            .data
                            .message
                    }
                />
            );

        default:
            return null;
    }
}


export function EventViewBlock({
    view,
}: {
    view: EventView;
}) {
    if (view.kind === "tool") {
        return (
            <ToolBlock
                view={view}
            />
        );
    }

    return (
        <BaseEvent
            event={
                view.event
            }
        />
    );
}