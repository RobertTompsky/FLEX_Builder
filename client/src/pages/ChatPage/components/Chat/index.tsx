import {
  reatomComponent,
} from "@reatom/react";
import type { AgentModel } from "../../../../model/agent/model";
import { Message } from "./Message";
import styles from "./styles.module.scss";
import {
  useState,
} from "react";
import type { ChatModel } from "../../../../model/chat/model";

type ChatProps = {
  agent: AgentModel;
  chat: ChatModel;
};

export const Chat = reatomComponent(({
  agent,
  chat
}: ChatProps) => {
  const [
    query,
    setQuery,
  ] = useState("");

  const messages = chat.messages();

  const runStatus = chat.run.status();

  const sendReady = chat.run.start.ready();

  const sendError = chat.run.start.error();

  const stopReady = chat.run.stop.ready();
  const isRunning = runStatus === "running";

  const canSend =
    !isRunning &&
    sendReady &&
    query.trim().length > 0 &&
    agent.configForm().model.length > 0;

  const canStop =
    isRunning &&
    stopReady;

  const handleSend = async (): Promise<void> => {
    const nextQuery =
      query.trim();

    if (
      !nextQuery ||
      !canSend
    ) {
      return;
    }

    const {
      name: _name,
      ...body
    } =
      agent.configForm();

    setQuery("");

    try {
      await chat.run.start({
        config: body,
        query: nextQuery,
      });
    } catch {
      // chat.run.start.error()
    }
  };

  const handleStop = async (): Promise<void> => {
    if (!canStop) {
      return;
    }

    try {
      await chat.run.stop();
    } catch {
      // chat.run.stop.error()
    }
  };

  return (
    <section
      className={styles.panel}
    >
      <div
        className={styles.body}
      >
        <section
          className={styles.messages}
        >
          {messages.map(
            (message, index) => (
              <Message
                key={index}
                role={message.role}
                status={message.status}
                content={message.content}
              />
            ),
          )}

          {sendError && (
            <div
              className={styles.error}
              role="alert"
            >
              {sendError.message}
            </div>
          )}
        </section>

        <footer
          className={styles.bottomBar}
        >
          <textarea
            className={styles.input}
            value={query}
            placeholder={
              isRunning
                ? "Agent is running..."
                : "Введите сообщение..."
            }
            onChange={(
              event,
            ) => {
              setQuery(
                event
                  .currentTarget
                  .value,
              );
            }}
            onKeyDown={(
              event,
            ) => {
              if (
                event.key ===
                "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();

                void handleSend();
              }
            }}
          />

          <button
            className={
              isRunning
                ? styles.stop
                : styles.send
            }
            type="button"
            disabled={
              isRunning
                ? !canStop
                : !canSend
            }
            onClick={() => {
              if (isRunning) {
                void handleStop();
              } else {
                void handleSend();
              }
            }}
          >
            {isRunning
              ? stopReady
                ? "STOP"
                : "STOPPING..."
              : sendReady
                ? "SEND"
                : "SENDING..."}
          </button>
        </footer>
      </div>
    </section>
  );
});