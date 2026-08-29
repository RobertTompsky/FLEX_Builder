import {
  useEffect,
} from "react";

import {
  reatomComponent,
} from "@reatom/react";

import {
  Outlet,
} from "react-router";

import {
  AgentsSidebar,
} from "../../components/AgentsSidebar";

import styles from "./styles.module.scss";
import { agents } from "../../model/agents";
import { metadata } from "../../model/metadata";

export const WorkspaceLayout = reatomComponent(() => {
  const identities = agents.list.data();

  const isReady =
    agents.list.ready() &&
    metadata.load.ready()

  const error =
    agents.list.error() ??
    metadata.load.error();

  useEffect(() => {
    const controller = new AbortController();

    void agents.list(controller.signal);

    void metadata.load(controller.signal);

    return () => controller.abort();
  }, []);

  const status =
    error
      ? "ERROR"
      : isReady
        ? "READY"
        : "LOADING";

  const agentsLabel =
    identities.length === 1
      ? "AGENT"
      : "AGENTS";

  return (
    <div
      className={
        styles.workspace
      }
    >
      <header
        className={
          styles.titlebar
        }
      >
        <div
          className={
            styles.title
          }
        >
          <span>
            флекс_BUILDER
          </span>
        </div>

        <div
          className={
            styles.windowControls
          }
        >
          <button
            type="button"
            aria-label="Minimize"
          >
            —
          </button>

          <button
            type="button"
            aria-label="Maximize"
          >
            □
          </button>

          <button
            type="button"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </header>

      <nav
        className={styles.menu}
        aria-label="Application menu"
      >
        <button type="button">
          File
        </button>

        <button type="button">
          View
        </button>

        <button type="button">
          Tools
        </button>

        <button type="button">
          Window
        </button>

        <button type="button">
          Help
        </button>
      </nav>

      <div
        className={styles.body}
      >
        <AgentsSidebar />

        <main
          className={
            styles.content
          }
        >
          <Outlet />
        </main>
      </div>

      <footer
        className={
          styles.statusbar
        }
      >
        <div
          className={
            styles.status
          }
        >
          <span
            className={
              styles.statusLight
            }
            aria-hidden="true"
          />

          {status}
        </div>

        <div>
          WORKSPACE: DEFAULT
        </div>

        <div
          className={
            styles.statusSpacer
          }
        />

        <div>
          {identities.length}{" "}
          {agentsLabel}
        </div>

        <div>
          BUILD 1.0.0
        </div>
      </footer>
    </div>
  );
});