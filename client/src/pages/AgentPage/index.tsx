import {
  useEffect,
} from "react";

import {
  reatomComponent,
} from "@reatom/react";

import {
  useNavigate,
  useParams,
} from "react-router";

import styles from "./styles.module.scss";
import { agents } from "../../model/agents";
import type { AgentModel } from "../../model/agents/model";

import {
  AgentChat,
} from "../../components/AgentChat";

import {
  AgentConfigPanel,
} from "../../components/AgentConfigPanel";

import {
  AgentFilesPanel,
} from "../../components/AgentFilesPanel";

import {
  EventsPanel,
} from "../../components/EventsPanel";

export function AgentPage() {
  const navigate =
    useNavigate();

  const {
    agentId,
  } = useParams<{
    agentId: string;
  }>();

  if (!agentId) {
    return (
      <section
        className={
          styles.agentPage
        }
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
      agent={
        agents.get(agentId)
      }
    />
  );
}

type AgentPageContentProps = {
  agent: AgentModel;
};

const AgentPageContent =
  reatomComponent(({
    agent,
  }: AgentPageContentProps) => {
    const navigate = useNavigate();

    const snapshot = agent.snapshot();
    const identity = snapshot?.identity
    const checkpoint = snapshot?.checkpoint

    const loadReady = agent.load.ready();
    const loadError = agent.load.error();

    const deleteReady = agents.delete.ready();
    const deleteError = agents.delete.error();

    const saveReady =
      agent.configForm.submit.ready();

    const saveError =
      agent.configForm.submit.error();

    useEffect(() => {
      if (checkpoint || !loadReady) {
        return;
      }

      void agent.load();
    }, [
      agent,
      checkpoint,
      loadReady,
    ]);

    const config = checkpoint?.data.config;
    const state = checkpoint?.data.state;
    const pageTitle = identity?.name ?? "Agent";
    const modelLabel = config?.model || "No model selected";
    const isLoading = !checkpoint && !loadError;

    const handleSave =
      async (): Promise<void> => {
        if (!saveReady) {
          return;
        }

        try {
          await agent.configForm.submit();
        } catch {
          console.error(saveError)
        }
      };

    const handleDelete = async (): Promise<void> => {
      if (!deleteReady) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete agent "${identity?.name ??
          agent.id
          }"?`,
        );

      if (!confirmed) {
        return;
      }

      try {
        await agents.delete(agent.id);
        navigate("/");
      } catch {
        // Ошибка отображается ниже.
      }
    };

    return (
      <section
        className={styles.agentPage}
      >
        <header className={styles.header}>
          <div className={styles.identity}>
            <div
              className={styles.icon}
              aria-hidden="true"
            >
              <span className={styles.iconWindow}>
                <span className={styles.iconWindowBar} />
                <span className={styles.iconCursor}>
                  _
                </span>
              </span>
            </div>

            <div className={styles.identityCopy}>
              <div className={styles.identityTitle}>
                <h1>{pageTitle.toLowerCase()}</h1>

                <span className={styles.status}>
                  ACTIVE
                </span>
              </div>

              <p>{modelLabel}</p>
            </div>
          </div>

          <div
            className={
              styles.actionsGroup
            }
          >
            <span
              className={
                styles.actionsLabel
              }
            >
              ACTIONS
            </span>

            <div
              className={
                styles.headerActions
              }
            >
              <button
                className={
                  styles.saveButton
                }
                type="button"
                disabled={!saveReady}
                onClick={() => {
                  void handleSave();
                }}
              >
                {saveReady
                  ? "SAVE"
                  : "SAVING..."}
              </button>

              <button
                className={
                  styles.deleteButton
                }
                type="button"
                disabled={!deleteReady}
                onClick={() => {
                  void handleDelete();
                }}
              >
                {deleteReady
                  ? "DELETE"
                  : "DELETING..."}
              </button>

              <button
                className={
                  styles.closeButton
                }
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
          <AgentConfigPanel agent={agent} />

          <AgentFilesPanel />
        </div>

        <AgentChat agent={agent}/>

        <div
          className={styles.events}
        >
          <EventsPanel agent={agent}/>
        </div>
      </section>
    );
  });