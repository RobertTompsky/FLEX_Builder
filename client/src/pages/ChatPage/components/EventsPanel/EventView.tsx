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
import { EventBlock } from "./shared/ui";
import { cx } from "../../../../shared";


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
        <>
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
            )}</>
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
    event,
}: {
    event: Extract<
        AgentSSEMessage,
        {
            event:
            | "started"
            | "timeout"
            | "output_exceeded"
            | "exit"
            | "rpc_trace";
        }
    >;
}) {
    switch (event.event) {
        case "started":
            return (
                <EventBlock
                    title="EXECUTION STARTED"
                    meta={`PID ${event.data.data.pid}`}
                    timestamp={event.data.timestamp}
                    category="execution"
                />
            );

        case "exit":
            return (
                <EventBlock
                    title="EXECUTION EXIT"
                    meta={
                        `CODE ${String(
                            event.data.data.exitCode,
                        )}`
                    }
                    timestamp={
                        event.data.timestamp
                    }
                    category="execution"
                />
            );

        case "timeout":
            return (
                <EventBlock
                    title="EXECUTION TIMEOUT"
                    timestamp={
                        event.data.timestamp
                    }
                    category="execution"
                >
                    <ErrorBlock
                        message={
                            `Execution timed out after ${event.data.data.timeoutMs} ms`
                        }
                    />
                </EventBlock>
            );

        case "output_exceeded":
            return (
                <EventBlock
                    title="OUTPUT EXCEEDED"
                    timestamp={
                        event.data.timestamp
                    }
                    category="execution"
                >
                    <ErrorBlock
                        message={
                            `Output exceeded ${event.data.data.maxOutputBytes} bytes`
                        }
                    />
                </EventBlock>
            );

        case "rpc_trace": {
            const data = event.data.data;

            const {
                phase,
                method,
                client,
                server,
            } = data;

            const from = phase === "request"
                ? client
                : server;

            const to = phase === "request"
                ? server
                : client;

            const isSandboxRun = method === "sandbox/run";

            const title = isSandboxRun
                ? phase === "request"
                    ? "SANDBOX RUN"
                    : "SANDBOX RESULT"
                : `RPC ${phase.toUpperCase()}`;

            const executeLabel = method === "execute"
                ? `${data.capability}.${data.action}`
                : undefined;

            const meta = isSandboxRun
                ? `${from} → ${to}`
                : executeLabel;

            return (
                <EventBlock
                    title={title}
                    meta={meta}
                    timestamp={
                        event.data.timestamp
                    }
                    category={
                        isSandboxRun
                            ? "sandbox"
                            : "rpc"
                    }
                >
                    {!isSandboxRun && (
                        <div
                            className={
                                styles.executionRoute
                            }
                        >
                            {from}
                            {" → "}
                            {to}
                        </div>
                    )}
                </EventBlock>
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

type StatusMessage = Extract<
    AgentSSEMessage,
    {
        event:
        "status";
    }
>;

function StatusBlock({
    event,
}: {
    event:
    StatusMessage;
}) {
    const {
        status,
        reason,
    } = event.data.data;

    return (
        <EventBlock
            title="STATUS"
            meta={status}
            timestamp={event.data.timestamp}
            category="status"
        >
            {reason && (
                <div
                    className={
                        styles.dim
                    }
                >
                    {reason}
                </div>
            )}
        </EventBlock>
    );
}

function ToolSelectionBlock({
    event,
}: {
    event: Extract<
        AgentSSEMessage,
        {
            event:
            "tool_selection";
        }
    >;
}) {
    const {
        policy,
        model,
        tools,
    } = event.data.data;

    const isDecision = policy === "decision";

    return (
        <EventBlock
            title="TOOL SELECTION"
            meta={policy}
            timestamp={event.data.timestamp}
            category="policy"
        >
            {isDecision && (
                <>
                    <div
                        className={styles.selectionModel}
                    >
                        <span>
                            MODEL{" "}
                        </span>
                        <span>
                            {model}
                        </span>
                    </div>

                    <div
                        className={styles.selectionBody}
                    >
                        {tools.map(
                            tool => (
                                <div
                                    key={tool.name}
                                    className={
                                        cx(
                                            styles.selectionTool,
                                            !tool.selected &&
                                            styles.selectionSkipped,
                                        )
                                    }
                                >
                                    <span>
                                        {tool.selected
                                            ? "■"
                                            : "□"}{" "}

                                        {tool.name}
                                    </span>

                                    <span
                                        className={styles.selectionProbability}
                                    >
                                        {
                                            tool.probability !==
                                                undefined
                                                ? `${(
                                                    tool.probability *
                                                    100
                                                ).toFixed(
                                                    1,
                                                )}%`
                                                : "—"
                                        }
                                    </span>
                                </div>
                            ),
                        )}
                    </div>
                </>
            )}
        </EventBlock>
    );
}

function ToolCallBlock({
    event,
    args,
}: {
    event: Extract<
        AgentSSEMessage,
        {
            event: "output_item.added";
        }
    >;

    args: string;
}) {
    const {
        name,
    } = event.data.data;

    return (
        <EventBlock
            title="TOOL CALL"
            meta={name}
            timestamp={
                event.data.timestamp
            }
            category="tool"
            opened
        >
            <CodeBlock
                code={args}
            />
        </EventBlock>
    );
}

function PreToolUseBlock({ event }: {
    event: Extract<
        AgentSSEMessage,
        {
            event:
            "pre_tool_use";
        }
    >;
}) {
    const data = event.data.data;

    return (
        <EventBlock
            title="PRE TOOL USE"
            meta={`${data.policy} → ${data.decision}`}
            timestamp={event.data.timestamp}
            category="policy"
        >
            {data.decision !== "allow" && data.reason && (
                <div
                    className={
                        styles.detail
                    }
                >
                    {data.reason}
                </div>
            )}
        </EventBlock>
    );
}

function ToolResultBlock({ event }: {
    event: Extract<
        AgentSSEMessage,
        {
            event:
            "tool_result";
        }
    >;
}) {
    const {
        name,
        outputPreview,
    } = event.data.data;

    return (
        <EventBlock
            title="TOOL RESULT"
            meta={name}
            timestamp={event.data.timestamp}
            category="result"
        >
            {outputPreview !== undefined && (
                <ResultBlock
                    result={
                        outputPreview
                    }
                />
            )}
        </EventBlock>
    );
}

function BaseEvent({
    event,
    argsById,
}: {
    event: AgentSSEMessage;
    argsById: Map<string, string>;
}) {
    switch (event.event) {
        case "status":
            return (
                <StatusBlock
                    event={event}
                />
            );

        case "tool_selection":
            return (
                <ToolSelectionBlock
                    event={event}
                />
            );

        case "output_item.added":
            return (
                <ToolCallBlock
                    event={event}
                    args={
                        argsById.get(
                            event.data.data.id,
                        ) ?? ""
                    }
                />
            );

        case "pre_tool_use":
            return (
                <PreToolUseBlock
                    event={event}
                />
            );

        case "started":
        case "timeout":
        case "output_exceeded":
        case "exit":
        case "rpc_trace":
            return (
                <ExecutionBlock
                    event={event}
                />
            );

        case "tool_result":
            return (
                <ToolResultBlock
                    event={event}
                />
            );

        case "llm_error":
            return (
                <div
                    className={
                        styles.eventBlock
                    }
                >
                    <ErrorBlock
                        message={
                            event
                                .data
                                .data
                                .message
                        }
                    />
                </div>
            );

        default:
            return null;
    }
}


export function EventViewBlock({
    view,
    argsById,
}: {
    view: EventView;
    argsById: Map<string, string>;
}) {
    return (
        <BaseEvent
            event={view.event}
            argsById={argsById}
        />
    );
}