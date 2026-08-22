import {
  reatomComponent,
} from "@reatom/react";
import type { AgentModel } from "../../model/agents/model";
import { Message } from "./Message";
import styles from "./styles.module.scss";
import {
  useState,
} from "react";

type AgentChatProps = {
  agent: AgentModel;
};

export const AgentChat =
  reatomComponent(({
    agent,
  }: AgentChatProps) => {
    const [
      query,
      setQuery,
    ] = useState("");

    const messages = agent.messages();

    const runStatus = agent.run.status();

    const sendReady = agent.run.send.ready();

    const sendError = agent.run.send.error();
    const stopReady = agent.run.stop.ready();
    const isRunning = runStatus === "running";

    const canSend =
      !isRunning &&
      sendReady &&
      query.trim().length > 0 &&
      agent.configForm().model.length > 0;

    const canStop =
      isRunning &&
      stopReady;

    const handleSend =
      async (): Promise<void> => {
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
          ...config
        } = agent.configForm();

        setQuery("");

        try {
          await agent.run.send({
            ...config,
            query: nextQuery,
          });
        } catch {
          // agent.run.send.error()
        }
      };

    const handleStop =
      async (): Promise<void> => {
        if (!canStop) {
          return;
        }

        try {
          await agent.run.stop();
        } catch {
          // agent.run.stop.error()
        }
      };

    return (
      <section
        className={styles.panel}
      >
        <header
          className={styles.header}
        >
          <span>
            chat.exe
          </span>
        </header>

        <div
          className={styles.body}
        >
          <section
            className={
              styles.messages
            }
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
                className={
                  styles.error
                }
                role="alert"
              >
                {sendError.message}
              </div>
            )}
          </section>

          <footer
            className={
              styles.bottomBar
            }
          >
            <textarea
              className={
                styles.input
              }
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