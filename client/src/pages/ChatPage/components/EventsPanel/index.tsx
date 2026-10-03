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
  type ToolView,
} from "./buildEventViews";

import {
  EventViewBlock,
} from "./EventView";

import styles from "./styles.module.scss";


type EventsPanelProps = {
  run: RunModel;
};

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


export const EventsPanel = reatomComponent(({
  run,
}: EventsPanelProps) => {
  const [
    approvedToolCallIds,
    setApprovedToolCallIds,
  ] = useState<Set<string>>(() => new Set());

  const events = run.events();

  const status = run.status();

  const views = buildEventViews(events);

  const currentRoundEvents = status ===
    "paused"
    ? getCurrentRoundEvents(
      events,
    )
    : [];

  const currentRoundViews = buildEventViews(currentRoundEvents);

  const pendingTools = currentRoundViews.filter(
    (
      view,
    ): view is ToolView =>
      view.kind ===
      "tool" &&
      view.status ===
      "pending",
  );

  const statusClass =
    status ===
      "failed"
      ? styles.statusError
      : styles[
      `status${status
        .charAt(0)
        .toUpperCase()
      }${status.slice(
        1,
      )
      }`
      ];


  const toggleToolCall = (
    callId:
      string,
  ): void => {
    setApprovedToolCallIds(
      (
        current,
      ) => {
        const next =
          new Set(
            current,
          );

        if (
          next.has(
            callId,
          )
        ) {
          next.delete(
            callId,
          );
        } else {
          next.add(
            callId,
          );
        }

        return next;
      },
    );
  };


  const handleResume =
    async (): Promise<void> => {
      await run.resume([
        ...approvedToolCallIds,
      ]);

      setApprovedToolCallIds(
        new Set(),
      );
    };


  const handleStop =
    async (): Promise<void> => {
      await run.stop();

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
          {
            String(
              events.length,
            ).padStart(
              3,
              "0",
            )
          }
          ]
        </span>
      </header>


      <div
        className={
          styles.screen
        }
      >
        {
          views.length ===
            0
            ? (
              <div
                className={
                  styles.empty
                }
              >
                No events recorded
              </div>
            )
            : (
              views.map(
                (
                  view,
                  index,
                ) => (
                  <EventViewBlock
                    key={
                      view.kind ===
                        "tool"
                        ? view.callId
                        : `${index}-${view.event.event}`
                    }
                    view={
                      view
                    }
                  />
                ),
              )
            )
        }
      </div>


      {
        status ===
        "paused" &&
        (
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
                {
                  pendingTools.length
                }
                ]
              </span>
            </div>


            <div
              className={
                styles.pendingList
              }
            >
              {
                pendingTools.map(
                  (
                    tool,
                  ) => {
                    const approved =
                      approvedToolCallIds.has(
                        tool.callId,
                      );

                    return (
                      <button
                        key={
                          tool.callId
                        }
                        className={
                          cx(
                            styles.pendingTool,

                            approved &&
                            styles.pendingToolApproved,
                          )
                        }
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
                          {
                            approved
                              ? "■"
                              : "□"
                          }
                        </span>

                        <span
                          className={
                            styles.pendingToolName
                          }
                        >
                          {
                            tool.name
                          }
                        </span>

                        <span
                          className={
                            styles.pendingToolState
                          }
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
                  !run
                    .resume
                    .ready()
                }
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
                className={
                  styles.stopButton
                }
                type="button"
                disabled={
                  !run
                    .stop
                    .ready()
                }
                onClick={() => {
                  void handleStop();
                }}
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


      <footer
        className={
          styles.footer
        }
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