import {
    useEffect,
    useState,
} from "react";

import {
    reatomComponent,
} from "@reatom/react";

import {
    Outlet,
    useNavigate,
    useParams,
} from "react-router";

import {
    agents,
} from "../../model/agent";

import type {
    AgentModel,
} from "../../model/agent/model";

import {
    AgentConfigPanel,
} from "../../components/AgentConfigPanel";

import {
    AgentFilesPanel,
} from "../../components/AgentFilesPanel";

import {
    ChatTabs,
} from "../../components/ChatTabs";

import styles from "./styles.module.scss";
import { createChatAction } from "../../model/chat/create";

export type AgentPageOutletContext = {
    agent: AgentModel;
};

export function AgentPage() {
    const navigate = useNavigate();

    const {
        agentId,
    } = useParams<{
        agentId: string;
    }>();

    if (!agentId) {
        return (
            <section
                className={styles.agentPage}
            >
                <div
                    className={styles.error}
                    role="alert"
                >
                    <h2>
                        FAILED TO LOAD AGENT
                    </h2>

                    <p>
                        Agent ID is missing
                    </p>

                    <button
                        type="button"
                        onClick={() => {
                            navigate("/");
                        }}
                    >
                        RETURN HOME
                    </button>
                </div>
            </section>
        );
    }

    return (
        <AgentPageContent
            agent={agents.get(agentId)}
        />
    );
}

type AgentPageContentProps = {
    agent: AgentModel;
};

const AgentPageContent = reatomComponent(({
    agent,
}: AgentPageContentProps) => {

    const [chatName, setChatName] = useState("");

    const chats = agent.chats();

    const createReady = createChatAction.ready();

    const createError = createChatAction.error();

    const {
        chatId,
    } = useParams<{
        chatId?: string;
    }>();

    const navigate = useNavigate();

    const data = agent.data();

    const loadReady = agent.load.ready();

    const loadError = agent.load.error();

    const deleteReady = agents.delete.ready();

    const deleteError = agents.delete.error();

    const saveReady = agent.configForm
        .submit
        .ready();

    const saveError = agent.configForm
        .submit
        .error();

    useEffect(() => {
        if (
            data ||
            loadError ||
            !loadReady
        ) {
            return;
        }

        void agent.load();
    }, [
        agent,
        data,
        loadError,
        loadReady,
    ]);

    useEffect(() => {
        if (chatId || chats.length === 0) {
            return;
        }

        const firstChat = chats[0];

        if (!firstChat) {
            return;
        }

        navigate(
            `/agents/${encodeURIComponent(
                agent.id,
            )}/chats/${encodeURIComponent(
                firstChat.id,
            )}`,
            {
                replace: true,
            },
        );
    }, [
        agent.id,
        chatId,
        chats,
        navigate,
    ]);

    const isLoading = !data && !loadError;

    if (isLoading) {
        return (
            <section
                className={styles.agentPage}
            >
                LOADING AGENT...
            </section>
        );
    }

    if (loadError || !data) {
        return (
            <section
                className={styles.agentPage}
            >
                <div
                    className={styles.error}
                    role="alert"
                >
                    <h2>
                        FAILED TO LOAD AGENT
                    </h2>

                    <p>
                        {
                            loadError
                                ?.message ??
                            "Unknown error"
                        }
                    </p>

                    <button
                        type="button"
                        onClick={() => {
                            navigate("/");
                        }}
                    >
                        RETURN HOME
                    </button>
                </div>
            </section>
        );
    }

    const {
        identity,
        config,
    } = data;

    const handleCreateChat = async (): Promise<void> => {

        const name = chatName.trim();

        if (!name || !createReady) {
            return;
        }

        try {
            const chat = await createChatAction(
                agent.id,
                name,
            );

            setChatName("");

            navigate(
                `/agents/${encodeURIComponent(
                    agent.id,
                )}/chats/${encodeURIComponent(
                    chat.id,
                )}`,
            );

        } catch {
            //
        }
    };

    const handleSave =
        async (): Promise<void> => {
            if (!saveReady) {
                return;
            }

            try {
                await agent
                    .configForm
                    .submit();
            } catch {
                //
            }
        };

    const handleDelete = async (): Promise<void> => {
        if (!deleteReady) {
            return;
        }

        const confirmed =
            window.confirm(
                `Delete agent "${identity.name}"?`,
            );

        if (!confirmed) {
            return;
        }

        try {
            await agents.delete(
                agent.id,
            );

            navigate("/");
        } catch {
            //
        }
    };

    return (
        <section
            className={styles.agentPage}
        >
            <header
                className={styles.header}
            >
                <div
                    className={styles.identity}
                >
                    <div
                        className={
                            styles.identityCopy
                        }
                    >
                        <div
                            className={styles.identityTitle}
                        >
                            <h1>
                                {identity.name.toLowerCase()}
                            </h1>

                            <span
                                className={styles.status}
                            >
                                ACTIVE
                            </span>
                        </div>

                        <p>
                            {config.model || "No model selected"}
                        </p>
                    </div>
                </div>

                <div className={styles.headerRight}>
                    <div
                        className={styles.createChat}
                    >
                        <input
                            type="text"
                            value={chatName}
                            placeholder="New chat"
                            disabled={!createReady}
                            onChange={event => {
                                setChatName(event.target.value);
                            }}
                            onKeyDown={event => {
                                if (event.key === "Enter"
                                ) {
                                    void handleCreateChat();
                                }
                            }}
                        />

                        <button
                            type="button"
                            disabled={
                                !createReady ||
                                !chatName.trim()
                            }
                            onClick={() => {
                                void handleCreateChat();
                            }}
                        >
                            {
                                createReady
                                    ? "CREATE"
                                    : "CREATING..."
                            }
                        </button>
                    </div>

                    <div
                        className={styles.headerActions}
                    >
                        <button
                            type="button"
                            className={styles.saveButton}
                            disabled={!saveReady}
                            onClick={() => {
                                void handleSave();
                            }}
                        >
                            {
                                saveReady
                                    ? "SAVE"
                                    : "SAVING..."
                            }
                        </button>

                        <button
                            type="button"
                            className={styles.deleteButton}
                            disabled={!deleteReady}
                            onClick={() => {
                                void handleDelete();
                            }}
                        >
                            {
                                deleteReady
                                    ? "DELETE"
                                    : "DELETING..."
                            }
                        </button>

                        <button
                            className={styles.closeButton}
                            type="button"
                            onClick={() => {
                                navigate("/");
                            }}
                        >
                            CLOSE
                        </button>
                    </div>
                </div>
            </header>

            <div
                className={styles.leftRail}
            >
                <AgentConfigPanel
                    agent={agent}
                />

                <AgentFilesPanel />
            </div>

            <div
                className={styles.chatTabs}
            >
                <ChatTabs
                    agent={agent}
                />
            </div>

            <Outlet
                context={{ agent }}
            />

            {saveError && (
                <div
                    role="alert"
                    className={
                        styles.error
                    }
                >
                    {saveError.message}
                </div>
            )}

            {deleteError && (
                <div
                    role="alert"
                    className={
                        styles.error
                    }
                >
                    {
                        deleteError.message
                    }
                </div>
            )}
        </section>
    );
});