import {
    reatomComponent,
} from "@reatom/react";

import type {
    ChatModel,
} from "../../model/chat/model";

import styles from "./styles.module.scss";
import type { Run } from "@flex-builder/shared/run";


type RunsPanelProps = {
    chat: ChatModel;
};


function formatRunId(
    runId: string,
): string {
    if (
        runId.length <= 14
    ) {
        return runId;
    }

    return `${runId.slice(
        0,
        10,
    )}...`;
}

function getRunDurationMs(
    run: Run,
): number | null {
    if (!run.finishedAt) {
        return null;
    }

    const startedAt =
        new Date(
            run.startedAt,
        ).getTime();

    const finishedAt =
        new Date(
            run.finishedAt,
        ).getTime();

    return Math.max(
        0,
        finishedAt - startedAt,
    );
}

function formatDuration(
    durationMs: number,
): string {
    if (durationMs < 1000) {
        return `${durationMs}ms`;
    }

    if (durationMs < 60_000) {
        return `${(
            durationMs /
            1000
        ).toFixed(1)
            }s`;
    }

    const minutes =
        Math.floor(
            durationMs /
            60_000,
        );

    const seconds =
        Math.floor(
            (
                durationMs %
                60_000
            ) /
            1000,
        );

    return `${minutes}m ${seconds}s`;
}

export const RunsPanel = reatomComponent(({
    chat,
}: RunsPanelProps) => {
    const runs = chat.runs();

    const successCount = runs.filter(
        run => run.status === "completed",
    ).length;

    const failedCount = runs.filter(
        run => run.status === "failed",
    ).length;

    return (
        <section
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
                        styles.title
                    }
                >
                    RUN HISTORY
                </span>

                <span
                    className={
                        styles.count
                    }
                >
                    [
                    {
                        String(
                            runs.length,
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
                    styles.columns
                }
            >
                <span>#</span>
                <span>RUN ID</span>
                <span>STATE</span>
                <span>TIME</span>
            </div>

            <div
                className={
                    styles.body
                }
            >
                {runs.length === 0 ? (
                    <div
                        className={
                            styles.empty
                        }
                    >
                        No runs recorded
                    </div>
                ) : (
                    runs.map(
                        (
                            run,
                            index,
                        ) => {
                            const duration =
                                getRunDurationMs(
                                    run,
                                );

                            return (
                                <button
                                    key={
                                        run.id
                                    }
                                    type="button"
                                    className={
                                        styles.run
                                    }
                                >
                                    <span
                                        className={
                                            styles.index
                                        }
                                    >
                                        {
                                            String(
                                                index + 1,
                                            ).padStart(
                                                2,
                                                "0",
                                            )
                                        }
                                    </span>

                                    <span
                                        className={
                                            styles.runId
                                        }
                                        title={
                                            run.id
                                        }
                                    >
                                        {
                                            formatRunId(
                                                run.id,
                                            )
                                        }
                                    </span>

                                    <span
                                        className={
                                            styles[
                                            `status${run.status
                                                .charAt(0)
                                                .toUpperCase()}${run.status.slice(
                                                    1,
                                                )}`
                                            ]
                                        }
                                    >
                                        {
                                            run.status
                                                .toUpperCase()
                                        }
                                    </span>

                                    <span
                                        className={
                                            styles.duration
                                        }
                                    >
                                        {
                                            duration !== null
                                                ? formatDuration(
                                                    duration,
                                                )
                                                : "--"
                                        }
                                    </span>
                                </button>
                            );
                        },
                    )
                )}
            </div>

            <footer
                className={
                    styles.footer
                }
            >
                <span
                    className={
                        styles.footerLead
                    }
                >
                    &gt;&gt;&gt;
                </span>

                <span
                    className={
                        styles.footerTotal
                    }
                >
                    {runs.length} RUNS TOTAL
                </span>

                <span
                    className={
                        styles.footerStat
                    }
                >
                    SUCCESS
                    <strong
                        className={
                            styles.success
                        }
                    >
                        {successCount}
                    </strong>
                </span>

                <span
                    className={
                        styles.footerStat
                    }
                >
                    FAILED
                    <strong
                        className={
                            styles.failed
                        }
                    >
                        {failedCount}
                    </strong>
                </span>
            </footer>
        </section>
    );
});