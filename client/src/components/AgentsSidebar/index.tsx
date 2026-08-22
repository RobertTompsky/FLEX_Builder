import {
  reatomComponent,
} from "@reatom/react";

import {
  NavLink,
  useNavigate,
} from "react-router";

import styles from "./styles.module.scss";

import {
  agents,
} from "../../model/agents";
import { useState } from "react";
import type { AgentListItem } from "@flex-builder/shared/agent";

function cx(
  ...classes: Array<
    string |
    false |
    null |
    undefined
  >
): string {
  return classes
    .filter(Boolean)
    .join(" ");
}

export const AgentsSidebar =
  reatomComponent(() => {
    const [
      sort,
      setSort,
    ] = useState<"date" | "name">("name");
    const navigate =
      useNavigate();

    const items = [...agents.list.data()]
      .sort((a, b) => {
        if (sort === "name") {
          return a.name.localeCompare(
            b.name,
          );
        }

        return (
          b.updatedAt -
          a.updatedAt
        );
      });

    const listReady =
      agents.list.ready();

    const listError =
      agents.list.error();

    const createReady =
      agents.create.ready();

    const createError =
      agents.create.error();

    const handleCreateAgent =
      async (): Promise<void> => {
        if (!createReady) {
          return;
        }

        try {
          const identity =
            await agents.create();

          navigate(
            `/agents/${encodeURIComponent(
              identity.id,
            )}`,
          );
        } catch {
          // error lives in
          // agents.create.error()
        }
      };

    return (
      <aside
        className={styles.sidebar}
      >
        <header
          className={styles.header}
        >
          <span className={styles.title}>
            AGENTS
          </span>

          <span
            className={
              styles.counter
            }
          >
            [
            {items.length}
            ]
          </span>
        </header>

        <div className={styles.sortBar}>
          <label className={styles.sortOption}>
            <input
              type="radio"
              name="agent-sort"
              checked={sort === "name"}
              onChange={() => {
                setSort("name");
              }}
            />

            <span>
              Sort by name
            </span>
          </label>

          <label className={styles.sortOption}>
            <input
              type="radio"
              name="agent-sort"
              checked={sort === "date"}
              onChange={() => {
                setSort("date");
              }}
            />

            <span>
              Sort by date
            </span>
          </label>
        </div>

        <div
          className={
            styles.content
          }
        >
          {!listReady &&
            items.length ===
            0 && (
              <div
                className={
                  styles.listMessage
                }
              >
                LOADING AGENTS...
              </div>
            )}

          {listError &&
            items.length ===
            0 && (
              <div
                className={
                  styles.listError
                }
                role="alert"
              >
                {
                  listError.message
                }
              </div>
            )}

          {createError && (
            <div
              className={
                styles.listError
              }
              role="alert"
            >
              {
                createError.message
              }
            </div>
          )}

          {listReady &&
            !listError &&
            items.length ===
            0 && (
              <div
                className={
                  styles.empty
                }
              >
                NO AGENTS
              </div>
            )}

          {items.length >
            0 && (
              <nav
                className={
                  styles.list
                }
                aria-label="Agents"
              >
                {items.map((agent) => (
                  <AgentLink
                    key={agent.id}
                    agent={agent}
                  />
                ))}
              </nav>
            )}
        </div>

        <div
          className={
            styles.actionsArea
          }
        >
          <button
            className={
              styles.newAgent
            }
            type="button"
            disabled={!createReady}
            onClick={
              handleCreateAgent
            }
          >
            <span
              className={
                styles.newAgentIcon
              }
              aria-hidden="true"
            >
              ⊞
            </span>

            <span>
              {createReady
                ? "NEW AGENT"
                : "CREATING..."}
            </span>
          </button>

          <button
            className={
              styles.templates
            }
            type="button"
            onClick={() => {
              navigate("/");
            }}
          >
            <span
              className={
                styles.templatesIcon
              }
              aria-hidden="true"
            >
              ▰
            </span>

            <span>
              TEMPLATES
            </span>
          </button>
        </div>
      </aside>
    );
  });

type AgentLinkProps = {
  agent: AgentListItem;
};

const AgentLink =
  reatomComponent(({
    agent,
  }: AgentLinkProps) => {
    const updatedLabel =
      new Date(
        agent.updatedAt,
      ).toLocaleString(
        undefined,
        {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        },
      );

    return (
      <NavLink
        to={`/agents/${encodeURIComponent(
          agent.id,
        )}`}
        className={({ isActive }) =>
          cx(
            styles.agent,
            isActive &&
            styles.active,
          )
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={cx(
                styles.agentCheck,
                isActive &&
                styles.agentCheckActive,
              )}
              aria-hidden="true"
            >
              {isActive && "✓"}
            </span>

            <span
              className={
                styles.agentName
              }
            >
              {agent.name}
            </span>

            <span
              className={
                styles.agentDate
              }
            >
              {updatedLabel}
            </span>
          </>
        )}
      </NavLink>
    );
  });