import {
  useState,
} from "react";

import {
  reatomComponent,
} from "@reatom/react";

import type {
  RunModel,
} from "../../../../model/run/model";

import {
  buildEventViews,
  getCurrentRoundEvents,
} from "./buildEventViews";

import {
  EventViewBlock,
} from "./EventView";

import styles from "./styles.module.scss";
import type { AgentSSEMessage } from "@flex-builder/shared/agent";
import type { EventBlockCategory } from "./shared/ui/EventBlock";
import { cx, toggleSetValue } from "../../../../shared";
import { EVENT_CATEGORIES } from "./shared/data";

type EventsPanelProps = {
  run: RunModel;
};

function buildArgsById(
  events: AgentSSEMessage[],
): Map<string, string> {
  const argsById =
    new Map<string, string>();

  for (const event of events) {
    switch (event.event) {
      case "arguments_delta": {
        const { id, delta } = event.data.data;

        argsById.set(
          id,
          (argsById.get(id) ?? "") + delta
        );

        break;
      }

      case "tool_call": {
        const {
          argsId,
          args,
        } = event.data.data;

        argsById.set(argsId, args);

        break;
      }
    }
  }

  return argsById;
}

export const EventsPanel = reatomComponent(({
  run,
}: EventsPanelProps) => {
  const [
    approvedToolCallIds,
    setApprovedToolCallIds,
  ] = useState<Set<string>>(() => new Set());

  const [
    enabledCategories,
    setEnabledCategories,
  ] = useState<
    Set<EventBlockCategory>
  >(() => new Set(EVENT_CATEGORIES.map(variant => variant.id)));

  const events = run.events();

  const status = run.status();

  const views = buildEventViews(events);

  const filteredViews = views.filter(view => enabledCategories.has(view.category),);

  const currentRoundEvents = status ===
    "paused"
    ? getCurrentRoundEvents(events)
    : [];

  const pendingTools = currentRoundEvents
    .filter(
      (
        event,
      ): event is Extract<
        AgentSSEMessage,
        {
          event:
          "tool_call";
        }
      > => event.event === "tool_call",
    )
    .map(
      event => ({
        callId: event.data.data.callId,
        name: event.data.data.name,
      }),
    );

  const statusClass = status === "failed"
    ? styles.statusError
    : styles[
    `status${status
      .charAt(0)
      .toUpperCase()
    }${status.slice(1)}`
    ];

  const argsById = buildArgsById(events);

  const toggleToolCall = (callId: string): void => {
    setApprovedToolCallIds(
      current => toggleSetValue(current, callId),
    );
  };

  const toggleCategory = (category: EventBlockCategory): void => {
    setEnabledCategories(
      current => toggleSetValue(current, category),
    );
  };

  const handleResume = async (): Promise<void> => {
    await run.resume([
      ...approvedToolCallIds,
    ]);

    setApprovedToolCallIds(new Set());
  };


  const handleStop = async (): Promise<void> => {
    await run.stop();
    setApprovedToolCallIds(new Set());
  };

  return (
    <aside
      className={styles.panel}
    >
      <header
        className={styles.header}
      >
        <span
          className={styles.headerTitle}
        >
          EVENT LOG
        </span>

        <span
          className={styles.headerCount}
        >
          [
          {String(events.length).padStart(3, "0")}
          ]
        </span>
      </header>


      <div
        className={styles.screen}
      >
        {
          filteredViews.length === 0
            ? (
              <div
                className={styles.empty}
              >
                No events recorded
              </div>
            )
            : (
              filteredViews.map(
                (
                  view,
                  index,
                ) => (
                  <EventViewBlock
                    key={`${index}-${view.event.event}`}
                    view={view}
                    argsById={argsById}
                  />
                ),
              )
            )
        }
      </div>


      {
        status === "paused" &&
        (
          <div
            className={styles.pendingTools}
          >
            <div
              className={styles.pendingHeader}
            >
              <span>
                PENDING TOOL CALLS
              </span>

              <span
                className={styles.pendingCount}
              >
                [
                {
                  pendingTools.length
                }
                ]
              </span>
            </div>


            <div
              className={styles.pendingList}
            >
              {
                pendingTools.map(
                  (
                    tool,
                  ) => {
                    const approved = approvedToolCallIds.has(tool.callId);

                    return (
                      <button
                        key={tool.callId}
                        className={
                          cx(
                            styles.pendingTool,

                            approved &&
                            styles.pendingToolApproved,
                          )
                        }
                        type="button"
                        onClick={() => { toggleToolCall(tool.callId) }}
                      >
                        <span
                          className={styles.pendingCheckbox}
                        >
                          {
                            approved
                              ? "■"
                              : "□"
                          }
                        </span>

                        <span
                          className={styles.pendingToolName}
                        >
                          {tool.name}
                        </span>

                        <span
                          className={styles.pendingToolState}
                        >
                          {
                            approved
                              ? "APPROVE"
                              : "REJECT"
                          }
                        </span>
                      </button>
                    );
                  },
                )
              }
            </div>

            <div
              className={styles.pendingActions}
            >
              <button
                className={styles.resumeButton}
                type="button"
                disabled={!run.resume.ready()}
                onClick={() => {
                  void handleResume();
                }}
              >
                {
                  run
                    .resume
                    .ready()
                    ? "RESUME"
                    : "RESUMING..."
                }
              </button>

              <button
                className={styles.stopButton}
                type="button"
                disabled={!run.stop.ready()}
                onClick={() => { void handleStop() }}
              >
                {
                  run
                    .stop
                    .ready()
                    ? "STOP"
                    : "STOPPING..."
                }
              </button>
            </div>
          </div>
        )
      }

      <div
        className={
          styles.legend
        }
      >
        <span
          className={
            styles.legendTitle
          }
        >
          LEGEND:
        </span>

        <div
          className={
            styles.legendItems
          }
        >
          {EVENT_CATEGORIES.map(
            variant => {
              const active = enabledCategories.has(variant.id);

              return (
                <button
                  key={variant.id}
                  type="button"
                  className={
                    cx(
                      styles.legendItem,
                      styles[
                      `variant_${variant.id}`
                      ],
                      !active &&
                      styles.legendItemDisabled,
                    )
                  }
                  onClick={() => { toggleCategory(variant.id) }}
                >
                  <span
                    className={
                      styles.legendIndicator
                    }
                  >
                    ■
                  </span>

                  {variant.label}
                </button>
              );
            },
          )}
        </div>
      </div>


      <footer
        className={styles.footer}
      >
        <span
          className={
            cx(
              styles.status,
              statusClass,
            )
          }
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