import {
    useState,
    type CSSProperties,
    type ReactNode
} from "react";
import styles from "./styles.module.scss";
import { cx } from "../../../../../../../shared";

export type EventBlockCategory =
    | "status"
    | "model"
    | "tool"
    | "policy"
    | "sandbox"
    | "execution"
    | "rpc"
    | "result"
    | "error";

type EventBlockProps = {
    title: ReactNode;
    meta?: ReactNode;
    timestamp?: number;
    children?: ReactNode;
    opened?: boolean;
    category?: EventBlockCategory;
};

export function EventBlock({
    title,
    meta,
    timestamp,
    children,
    opened = false,
    category
}: EventBlockProps) {
    const [
        isOpen,
        setIsOpen,
    ] = useState(
        opened,
    );

    const formattedTimestamp =
        timestamp !== undefined
            ? new Date(
                timestamp,
            ).toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                },
            )
            : "";

    return (
        <div
            className={
                cx(
                    styles.event,
                    styles[
                    `variant_${category ?? "status"}`
                    ],
                )
            }
        >
            <button
                className={
                    cx(
                        styles.header,
                        !children &&
                        styles.headerStatic,
                    )
                }
                type="button"
                onClick={() => {
                    if (!children) {
                        return;
                    }

                    setIsOpen(
                        current =>
                            !current,
                    );
                }}
            >
                <span
                    className={
                        styles.timestamp
                    }
                >
                    {formattedTimestamp}
                </span>
                <div
                    className={
                        styles.eventSection
                    }
                >
                    <span
                        className={
                            styles.indicator
                        }
                    >
                        ■
                    </span>

                    <span
                        className={
                            styles.title
                        }
                    >
                        {title}
                    </span>
                </div>

                <div
                    className={
                        styles.metaSection
                    }
                >
                    {children && (
                        <span
                            className={
                                cx(
                                    styles.chevron,
                                    isOpen &&
                                    styles.chevronOpen,
                                )
                            }
                        >
                            ▸
                        </span>
                    )}

                    <span
                        className={
                            styles.meta
                        }
                    >
                        {meta}
                    </span>
                </div>
            </button>

            {children && isOpen && (
                <div
                    className={
                        styles.body
                    }
                >
                    {children}
                </div>
            )}
        </div>
    );
}