import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    reatomComponent,
} from "@reatom/react";

import {
    useNavigate,
    useOutletContext,
    useParams,
} from "react-router";

import {
    chats,
} from "../../model/chat";

import {
    createChatModel,
    type ChatModel,
} from "../../model/chat/model";

import type {
    AgentPageOutletContext,
} from "../AgentPage";

import {
    Chat,
} from "./components/Chat";

import {
    EventsPanel,
} from "./components/EventsPanel";

import styles from "./styles.module.scss";
import { RunsPanel } from "./components/RunsPanel";

type ChatPageRouteProps = {
    agent: AgentPageOutletContext["agent"];
    chatId: string;
};

function ChatPageRoute({
    agent,
    chatId,
}: ChatPageRouteProps) {
    const [chat] = useState(
        () => createChatModel(
            agent.id,
            chatId,
        ),
    );

    return (
        <ChatPageContent
            agent={agent}
            chat={chat}
        />
    );
}

export function ChatPage() {
    const navigate =
        useNavigate();

    const {
        agent,
    } =
        useOutletContext<
            AgentPageOutletContext
        >();

    const {
        chatId,
    } =
        useParams<{
            chatId:
            string;
        }>();


    if (!chatId) {
        return (
            <section
                className={
                    styles.chatPage
                }
            >
                <div
                    className={
                        styles.error
                    }
                    role="alert"
                >
                    <h2>
                        FAILED TO LOAD CHAT
                    </h2>

                    <p>
                        Chat ID is missing
                    </p>

                    <button
                        type="button"
                        onClick={() => {
                            navigate(
                                `/agents/${encodeURIComponent(
                                    agent.id,
                                )}`,
                            );
                        }}
                    >
                        BACK TO AGENT
                    </button>
                </div>
            </section>
        );
    }

    return (
        <ChatPageRoute
            key={chatId}
            agent={agent}
            chatId={chatId}
        />
    );
}

type ChatPageContentProps = {
    agent: AgentPageOutletContext["agent"];
    chat: ChatModel;
};

const ChatPageContent = reatomComponent(({
    agent,
    chat,
}: ChatPageContentProps) => {
    const navigate = useNavigate();

    const data = chat.data();

    const loadError = chat.load.error();

    useEffect(() => {
        if (data || loadError) {
            return;
        }

        void chat.load();
    }, [
        chat,
        data,
        loadError,
    ]);

    useEffect(() => {
        const controller = new AbortController();

        void chat.load(controller.signal);

        return () => {
            controller.abort();
        };
    }, [
        chat,
    ]);

    const isLoading = !data && !loadError;

    if (isLoading) {
        return (
            <section
                className={styles.chatPage}
            >
                LOADING CHAT...
            </section>
        );
    }

    if (loadError || !data) {
        return (
            <section
                className={styles.chatPage}
            >
                <div
                    className={styles.error}
                    role="alert"
                >
                    <h2>
                        FAILED TO LOAD CHAT
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
                            navigate(
                                `/agents/${encodeURIComponent(
                                    agent.id,
                                )}`,
                            );
                        }}
                    >
                        BACK TO AGENT
                    </button>
                </div>
            </section>
        );
    }

    return (
        <div
            className={styles.chatPage}
        >
            <div
                className={styles.chat}
            >
                <Chat
                    agent={agent}
                    chat={chat}
                />
            </div>

            <div
                className={styles.rightRail}
            >
                <div
                    className={styles.runs}
                >
                    <RunsPanel
                        chat={chat}
                    />
                </div>

                <div
                    className={styles.events}
                >
                    <EventsPanel
                        run={chat.run}
                    />
                </div>
            </div>
        </div>
    );
});