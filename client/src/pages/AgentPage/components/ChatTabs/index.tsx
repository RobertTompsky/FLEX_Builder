import {
    reatomComponent,
} from "@reatom/react";

import {
    NavLink,
    useNavigate,
} from "react-router";

import type {
    AgentModel,
} from "../../../../model/agent/model";

import {
    deleteChatAction,
} from "../../../../model/chat/delete";

import styles from "./styles.module.scss";

type ChatTabsProps = {
    agent: AgentModel;
};

export const ChatTabs = reatomComponent(({
    agent,
}: ChatTabsProps) => {

    const chats = agent.chats();

    const navigate = useNavigate();

    const handleDelete = async (
        chatId: string,
    ) => {
        const confirmed = window.confirm("Delete chat?");

        if (!confirmed) {
            return;
        }

        const result = await deleteChatAction({
            agent,
            chatId,
        });

        if (result.deletedAgent) {
            navigate("/");
            return;
        }

        const nextChat = result.remainingChats[0];

        if (nextChat) {
            navigate(
                `/agents/${encodeURIComponent(
                    agent.id,
                )}/chats/${encodeURIComponent(
                    nextChat.id,
                )}`,
            );
        }
    };

    return (
        <div
            className={styles.tabs}
        >
            {chats.map(chat => (
                <div
                    key={chat.id}
                    className={styles.tab}
                >
                    <div className={styles.tabContent}>
                        <NavLink
                            to={
                                `/agents/${encodeURIComponent(
                                    agent.id,
                                )}/chats/${encodeURIComponent(
                                    chat.id,
                                )}`
                            }
                            className={({ isActive }) =>
                                isActive
                                    ? styles.activeTabLink
                                    : styles.tabLink
                            }
                        >
                            <span
                                className={styles.tabIcon}
                                aria-hidden="true"
                            >
                                ▤
                            </span>

                            <span
                                className={styles.tabTitle}
                            >
                                {
                                    chat.title ??
                                    "New chat"
                                }
                            </span>
                        </NavLink>

                        <button
                            type="button"
                            className={styles.deleteTab}
                            onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();

                                void handleDelete(
                                    chat.id,
                                );
                            }}
                        >
                            ×
                        </button>
                    </div>

                </div>
            ),
            )}
        </div>
    );
});