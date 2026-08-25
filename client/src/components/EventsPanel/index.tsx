import {
  reatomComponent,
} from "@reatom/react";

import type {
  AgentModel,
} from "../../model/agents/model";

import styles from "./styles.module.scss";
import {
  Prism as SyntaxHighlighter,
} from "react-syntax-highlighter";

import {
  atomDark,
  // oneDark,
  // darcula
} from "react-syntax-highlighter/dist/esm/styles/prism";
import ReactMarkdown from "react-markdown";
import { useState } from "react";
import {
  js as beautifyJs,
} from "js-beautify";
import type {
  AgentEvent,
  AgentIdentity,
  AgentSSEMessage,
  ToAgentSSEMessage
} from "@flex-builder/shared/agent";

type EventsPanelProps = {
  agent: AgentModel;
};


type ArtifactSSEEvent = Extract<
  AgentSSEMessage,
  {
    event:
    | "artifact_read"
    | "artifact_created";
  }
>;

type ArtifactView = {
  kind: "artifact";
  order: number;
  event: ArtifactSSEEvent;
};

type SubagentToolView = {
  id: string;
  callId: string;
  name: string;

  args?: string;
  result?: string;
};

type SubagentView = {
  kind: "subagent";

  order: number;

  runId: string;
  subagent: AgentIdentity;

  events: ToAgentSSEMessage<AgentEvent>[];

  tools: SubagentToolView[];

  response: string;

  responseStatus: ResponseStatus;
};

type NestedView =
  | ArtifactView
  | SubagentView;

type ToolView = {
  kind: "tool";

  id: string;
  callId: string;
  name: string;

  args?: string;
  result?: string;

  nested: NestedView[];
};

type BaseEventView = {
  kind: "event";
  event: AgentSSEMessage;
};

type EventView =
  | ToolView
  | BaseEventView;

type RawSubagentGroup = {
  order: number;

  runId: string;
  subagent: AgentIdentity;

  events: ToAgentSSEMessage<AgentEvent>[];
};

type ResponseStatus =
  | "in_progress"
  | "completed"
  | "incomplete"
  | null;

type EventCollections = {
  argsById: Map<string, string>;
  resultsByCallId: Map<string, string>;
  artifactsByCallId:
  Map<string, ArtifactView[]>;
  subagentsByCallId:
  Map<
    string,
    Map<
      string,
      RawSubagentGroup
    >
  >;
};

function appendMapValue(
  map: Map<string, string>,
  key: string,
  value: string,
): void {
  map.set(
    key,
    (map.get(key) ?? "") +
    value,
  );
}

function cx(
  ...classes: Array<
    string |
    false |
    null |
    undefined
  >
): string {
  return classes
    .filter(Boolean)
    .join(" ");
}

function decodePartialJsonString(
  value: string,
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
      result += char;
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
        break;
    }

    index++;
  }

  return result;
}

function extractStreamingCode(
  raw: string,
): string | null {
  const match =
    /"code"\s*:\s*"/.exec(raw);

  if (
    !match ||
    match.index === undefined
  ) {
    return null;
  }

  const start =
    match.index +
    match[0].length;

  return decodePartialJsonString(
    raw.slice(start),
  );
}

function extractCode(
  raw: string,
): string {
  try {
    const parsed =
      JSON.parse(raw.trim()) as {
        code?: unknown;
      };

    return typeof parsed.code ===
      "string"
      ? parsed.code
      : raw;
  } catch {
    return (
      extractStreamingCode(raw) ??
      raw
    );
  }
}

function formatCode(
  raw: string,
): string {
  return beautifyJs(
    extractCode(raw),
    {
      indent_size: 2,
      wrap_line_length: 60,
      preserve_newlines: true,
    },
  );
}

function buildSubagentTools(
  events: ToAgentSSEMessage<AgentEvent>[],
): SubagentToolView[] {
  const argsById =
    new Map<string, string>();

  const resultsByCallId =
    new Map<string, string>();

  for (const event of events) {
    if (
      event.event ===
      "arguments_delta"
    ) {
      const {
        id,
        delta,
      } = event.data.data;

      appendMapValue(
        argsById,
        id,
        delta,
      );

      continue;
    }

    if (
      event.event ===
      "tool_result"
    ) {
      const {
        callId,
        outputPreview,
      } = event.data.data;

      resultsByCallId.set(
        callId,
        outputPreview ?? "",
      );
    }
  }

  const tools:
    SubagentToolView[] = [];

  const rendered =
    new Set<string>();

  for (const event of events) {
    if (
      event.event !==
      "output_item.added"
    ) {
      continue;
    }

    const {
      id,
      callId,
      name,
    } = event.data.data;

    if (
      rendered.has(callId)
    ) {
      continue;
    }

    rendered.add(callId);

    tools.push({
      id,
      callId,
      name,
      args:
        argsById.get(id),
      result:
        resultsByCallId.get(
          callId,
        ),
    });
  }

  return tools;
}

function buildSubagentView(
  group: RawSubagentGroup,
): SubagentView {
  let response = "";

  let responseStatus:
    ResponseStatus = null;

  for (
    const event of group.events
  ) {
    switch (event.event) {
      case "text_delta": {
        response +=
          event.data.data.delta;

        responseStatus =
          "in_progress";

        break;
      }

      case "text_end": {
        if (!response) {
          response =
            event.data.data.fullText;
        }

        responseStatus =
          "completed";

        break;
      }

      case "stop":
      case "error": {
        if (response) {
          responseStatus =
            "incomplete";
        }

        break;
      }
    }
  }

  return {
    kind: "subagent",

    order:
      group.order,

    runId:
      group.runId,

    subagent:
      group.subagent,

    events:
      group.events,

    tools:
      buildSubagentTools(
        group.events,
      ),

    response,
    responseStatus,
  };
}

function collectEventData(
  events: AgentSSEMessage[],
): EventCollections {
  const argsById =
    new Map<string, string>();

  const resultsByCallId =
    new Map<string, string>();

  const artifactsByCallId =
    new Map<
      string,
      ArtifactView[]
    >();

  const subagentsByCallId =
    new Map<
      string,
      Map<
        string,
        RawSubagentGroup
      >
    >();

  for (
    let index = 0;
    index < events.length;
    index++
  ) {
    const event = events[index];

    if (!event) {
      continue;
    }

    switch (event.event) {
      case "arguments_delta": {
        const {
          id,
          delta,
        } = event.data.data;

        appendMapValue(
          argsById,
          id,
          delta,
        );

        break;
      }

      case "tool_result": {
        const {
          callId,
          outputPreview,
        } = event.data.data;

        resultsByCallId.set(
          callId,
          outputPreview ?? "",
        );

        break;
      }

      case "artifact_read":
      case "artifact_created": {
        const {
          toolCallId,
        } = event.data.data;

        const artifacts =
          artifactsByCallId.get(
            toolCallId,
          ) ?? [];

        artifacts.push({
          kind: "artifact",
          order: index,
          event,
        });

        artifactsByCallId.set(
          toolCallId,
          artifacts,
        );

        break;
      }

      case "subagent_event": {
        const {
          parentToolCallId,
          subagentRunId,
          subevent,
        } = event.data.data;

        const subagent =
          subevent.data.agent;

        let byRun =
          subagentsByCallId.get(
            parentToolCallId,
          );

        if (!byRun) {
          byRun = new Map();

          subagentsByCallId.set(
            parentToolCallId,
            byRun,
          );
        }

        let group =
          byRun.get(
            subagentRunId,
          );

        if (!group) {
          group = {
            order: index,
            runId:
              subagentRunId,
            subagent,
            events: [],
          };

          byRun.set(
            subagentRunId,
            group,
          );
        }

        group.events.push(
          subevent,
        );

        break;
      }
    }
  }

  return {
    argsById,
    resultsByCallId,
    artifactsByCallId,
    subagentsByCallId,
  };
}

function getCurrentRoundEvents(
  events: AgentSSEMessage[],
): AgentSSEMessage[] {
  if (
    events.at(-1)?.event !==
    "pause"
  ) {
    return [];
  }

  for (
    let index =
      events.length - 2;
    index >= 0;
    index--
  ) {
    if (
      events[index]?.event ===
      "pause"
    ) {
      return events.slice(
        index + 1,
      );
    }
  }

  return events;
}

function buildEventViews(
  events: AgentSSEMessage[],
): EventView[] {
  const {
    argsById,
    resultsByCallId,
    artifactsByCallId,
    subagentsByCallId,
  } = collectEventData(events);

  const isCurrentlyPaused =
    events.at(-1)?.event ===
    "pause";

  const views: EventView[] = [];
  const renderedCalls =
    new Set<string>();

  for (const event of events) {
    switch (event.event) {
      /*
       * Эти события входят
       * в агрегированные blocks.
       */
      case "arguments_delta":
      case "tool_call":
      case "tool_result":
      case "artifact_read":
      case "artifact_created":
      case "subagent_event":

      /*
       * Текст основного агента
       * уже показывается в чате.
       */
      case "text_delta":
      case "text_end":
        continue;

      case "pause": {
        if (isCurrentlyPaused) {
          views.push({
            kind: "event",
            event,
          });
        }

        continue;
      }

      case "output_item.added": {
        const {
          id,
          callId,
          name,
        } = event.data.data;

        if (
          renderedCalls.has(
            callId,
          )
        ) {
          continue;
        }

        renderedCalls.add(
          callId,
        );

        const artifacts =
          artifactsByCallId.get(
            callId,
          ) ?? [];

        const subagents = [
          ...(
            subagentsByCallId
              .get(callId)
              ?.values() ??
            []
          ),
        ].map(
          buildSubagentView,
        );

        const nested: NestedView[] = [
          ...artifacts,
          ...subagents,
        ].sort(
          (
            left,
            right,
          ) =>
            left.order -
            right.order,
        );

        views.push({
          kind: "tool",
          id,
          callId,
          name,
          args:
            argsById.get(id),
          result:
            resultsByCallId.get(
              callId,
            ),
          nested,
        });

        continue;
      }

      default:
        views.push({
          kind: "event",
          event,
        });
    }
  }

  return views;
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
        style={atomDark}
        customStyle={{
          margin: 0,
          padding: "6px 8px",
          background:
            "transparent",

          fontSize: "10px",
          lineHeight: 1.4,
        }}
        codeTagProps={{
          style: {
            fontFamily:
              'Consolas, "Courier New", monospace',
          },
        }}
      >
        {formatCode(code)}
      </SyntaxHighlighter>
    </div>
  );
}

function tryFormatJson(
  value: string,
): string | null {
  try {
    let parsed =
      JSON.parse(value);

    if (
      typeof parsed ===
      "string"
    ) {
      try {
        parsed =
          JSON.parse(parsed);
      } catch {
        // оставляем строкой
      }
    }

    if (
      typeof parsed !==
      "object" ||
      parsed === null
    ) {
      return null;
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

function ResultBlock({
  result,
}: {
  result: string;
}) {
  const formattedJson =
    tryFormatJson(result);

  return (
    <details
      className={
        styles.expandable
      }
    >
      <summary
        className={styles.file}
      >
        RESULT.txt
      </summary>

      {formattedJson ? (
        <div
          className={
            styles.resultCode
          }
        >
          <SyntaxHighlighter
            language="json"
            style={atomDark}
            customStyle={{
              margin: 0,
              padding: "6px 8px",
              background:
                "transparent",
              fontSize: "10px",
              lineHeight: 1.5,
            }}
            codeTagProps={{
              style: {
                fontFamily:
                  'Consolas, "Courier New", monospace',
              },
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
          {result ||
            "[empty result]"}
        </pre>
      )}
    </details>
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
  } = event.data.data;

  return (
    <div
      className={
        styles.nestedEvent
      }
    >
      <div
        className={[
          styles.line,
          styles.artifact,
        ].join(" ")}
      >
        {created
          ? "ARTIFACT CREATED"
          : "ARTIFACT READ"}
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
        TOOL: {view.name}
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
            code={view.args}
          />
        </details>
      )}

      {view.result !==
        undefined && (
          <ResultBlock
            result={
              view.result
            }
          />
        )}
    </div>
  );
}

function SubagentBlock({
  view,
}: {
  view: SubagentView;
}) {
  const endEvent =
    view.events.findLast(
      (event) =>
        event.event ===
        "end" ||
        event.event ===
        "error" ||
        event.event ===
        "stop",
    );

  return (
    <div
      className={styles.subagentBlock}
    >
      <div
        className={[
          styles.line,
          styles.subagent,
        ].join(" ")}
      >
        SUBAGENT:{" "}
        {view.subagent.name}
      </div>

      <div
        className={styles.nestedMeta}
      >
        {view.runId}
      </div>

      {view.tools.map(
        (tool) => (
          <SubagentToolBlock
            key={tool.callId}
            view={tool}
          />
        ),
      )}

      {view.response && (
        <details
          className={styles.expandable}
          open={
            view.responseStatus ===
            "in_progress"
          }
        >
          <summary
            className={styles.file}
          >
            RESPONSE.md
          </summary>

          <div
            className={[
              styles.response,
              view.responseStatus ===
              "in_progress" &&
              styles.responseStreaming,
              view.responseStatus ===
              "incomplete" &&
              styles.responseIncomplete,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <ReactMarkdown>
              {view.response}
            </ReactMarkdown>
          </div>
        </details>
      )}

      {endEvent?.event ===
        "end" && (
          <div
            className={styles.subagentDone}
          >
            {endEvent.data.data.message}
          </div>
        )}

      {endEvent?.event ===
        "stop" && (
          <div
            className={
              styles.subagentStopped
            }
          >
            {endEvent.data.data.reason}
          </div>
        )}

      {endEvent?.event ===
        "error" && (
          <div
            className={styles.subagentError}
          >
            {endEvent.data.data.message}
          </div>
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
        className={[
          styles.line,
          styles.tool,
        ].join(" ")}
      >
        TOOL: {view.name}
      </div>

      {view.args && (
        <details
          className={styles.expandable}
          open
        >
          <summary
            className={styles.file}
          >
            code.js
          </summary>

          <CodeBlock
            code={view.args}
          />
        </details>
      )}

      {view.nested.length >
        0 && (
          <div
            className={styles.nested}
          >
            {view.nested.map(
              (nested) => {
                if (
                  nested.kind ===
                  "artifact"
                ) {
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
                }

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
              },
            )}
          </div>
        )}

      {view.result !==
        undefined && (
          <ResultBlock
            result={
              view.result
            }
          />
        )}
    </div>
  );
}

function BaseEvent({
  event,
}: {
  event: AgentSSEMessage;
}) {
  switch (event.event) {
    case "init":
      return (
        <div
          className={[
            styles.line,
            styles.init,
          ].join(" ")}
        >
          {
            event.data.data
              .message
          }

          <span
            className={
              styles.dim
            }
          >
            {
              event.data.data
                .runId
            }
          </span>
        </div>
      );

    case "end":
      return (
        <div
          className={[
            styles.line,
            styles.done,
          ].join(" ")}
        >
          {
            event.data.data
              .message
          }
        </div>
      );

    case "pause":
      return (
        <div
          className={
            styles.pause
          }
        >
          <div
            className={[
              styles.line,
              styles.pauseTitle,
            ].join(" ")}
          >
            ‖ PAUSED
          </div>

          <div
            className={
              styles.pauseReason
            }
          >
            Reason:{" "}
            <span>
              {
                event.data.data
                  .reason
              }
            </span>
          </div>
        </div>
      );

    case "stop":
      return (
        <div
          className={
            styles.stop
          }
        >
          <div
            className={[
              styles.line,
              styles.stopTitle,
            ].join(" ")}
          >
            STOP
          </div>

          <div
            className={
              styles.stopReason
            }
          >
            Reason:{" "}
            <span>
              {
                event.data.data
                  .reason
              }
            </span>
          </div>
        </div>
      );

    case "error":
      return (
        <div
          className={[
            styles.line,
            styles.error,
          ].join(" ")}
        >
          ERROR:{" "}
          {
            event.data.data
              .message
          }
        </div>
      );

    default:
      return null;
  }
}

export const EventsPanel =
  reatomComponent(({
    agent,
  }: EventsPanelProps) => {
    const [
      approvedToolCallIds,
      setApprovedToolCallIds,
    ] = useState<Set<string>>(
      () => new Set(),
    );

    const events =
      agent.run.events();

    const status =
      agent.run.status();

    const views =
      buildEventViews(
        events,
      );

    const currentRoundEvents =
      status === "paused"
        ? getCurrentRoundEvents(
          events,
        )
        : [];

    const currentRoundViews =
      buildEventViews(
        currentRoundEvents,
      );

    const pendingTools =
      currentRoundViews.filter(
        (
          view,
        ): view is ToolView =>
          view.kind === "tool" &&
          view.result ===
          undefined,
      );

    const statusClass =
      styles[
      `status${status
        .charAt(0)
        .toUpperCase()}${status.slice(
          1,
        )}`
      ];

    const toggleToolCall = (
      callId: string,
    ): void => {
      setApprovedToolCallIds(
        (current) => {
          const next =
            new Set(current);

          if (next.has(callId)) {
            next.delete(callId);
          } else {
            next.add(callId);
          }

          return next;
        },
      );
    };

    const handleResume =
      async (): Promise<void> => {
        await agent.run.resume([
          ...approvedToolCallIds,
        ]);

        setApprovedToolCallIds(
          new Set(),
        );
      };

    const handleStop =
      async (): Promise<void> => {
        await agent.run.stop();

        setApprovedToolCallIds(
          new Set(),
        );
      };


    return (
      <aside
        className={
          styles.panel
        }
      >
        <header
          className={
            styles.header
          }
        >
          <span
            className={
              styles.headerTitle
            }
          >
            EVENT LOG
          </span>

          <span
            className={
              styles.headerCount
            }
          >
            [
            {String(
              events.length,
            ).padStart(
              3,
              "0",
            )}
            ]
          </span>
        </header>

        <div
          className={
            styles.screen
          }
        >
          {views.length ===
            0 ? (
            <div
              className={
                styles.empty
              }
            >
              No events recorded
            </div>
          ) : (
            views.map(
              (
                view,
                index,
              ) => {
                if (
                  view.kind ===
                  "tool"
                ) {
                  return (
                    <ToolBlock
                      key={
                        view.callId
                      }
                      view={view}
                    />
                  );
                }

                return (
                  <BaseEvent
                    key={
                      `${index}-${view.event.event}`
                    }
                    event={
                      view.event
                    }
                  />
                );
              },
            )
          )}
        </div>

        {status === "paused" && (
          <div
            className={
              styles.pendingTools
            }
          >
            <div
              className={
                styles.pendingHeader
              }
            >
              <span>
                PENDING TOOL CALLS
              </span>

              <span
                className={
                  styles.pendingCount
                }
              >
                [
                {pendingTools.length}
                ]
              </span>
            </div>

            <div
              className={
                styles.pendingList
              }
            >
              {pendingTools.map(
                (tool) => {
                  const approved =
                    approvedToolCallIds.has(
                      tool.callId,
                    );

                  return (
                    <button
                      key={
                        tool.callId
                      }
                      className={cx(
                        styles.pendingTool,
                        approved &&
                        styles.pendingToolApproved,
                      )}
                      type="button"
                      onClick={() => {
                        toggleToolCall(
                          tool.callId,
                        );
                      }}
                    >
                      <span
                        className={
                          styles.pendingCheckbox
                        }
                      >
                        {approved
                          ? "■"
                          : "□"}
                      </span>

                      <span
                        className={
                          styles.pendingToolName
                        }
                      >
                        {tool.name}
                      </span>

                      <span
                        className={
                          styles.pendingToolState
                        }
                      >
                        {approved
                          ? "APPROVE"
                          : "REJECT"}
                      </span>
                    </button>
                  );
                },
              )}
            </div>

            <div
              className={
                styles.pendingActions
              }
            >
              <button
                className={
                  styles.resumeButton
                }
                type="button"
                disabled={
                  !agent.run.resume.ready()
                }
                onClick={() => {
                  void handleResume();
                }}
              >
                {agent.run.resume.ready()
                  ? "RESUME"
                  : "RESUMING..."}
              </button>

              <button
                className={
                  styles.stopButton
                }
                type="button"
                disabled={
                  !agent.run.stop.ready()
                }
                onClick={() => {
                  void handleStop();
                }}
              >
                {agent.run.stop.ready()
                  ? "STOP"
                  : "STOPPING..."}
              </button>
            </div>
          </div>
        )}

        <footer
          className={
            styles.footer
          }
        >
          <span
            className={[
              styles.status,
              statusClass,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {status}
          </span>

          <span>
            Event Monitor v2.0
          </span>
        </footer>
      </aside>
    );
  });