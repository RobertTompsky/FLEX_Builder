import {
  reatomComponent,
} from "@reatom/react";

import {
  useNavigate,
} from "react-router";

import {
  agents,
} from "../../model/agents";

export const HomePage = reatomComponent(() => {
  const navigate =
    useNavigate();

  const identities =
    agents.list.data();

  const hasAgents =
    identities.length > 0;

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
        const agent =
          await agents.create();

        navigate(
          `/agents/${encodeURIComponent(
            agent.id,
          )}`,
        );
      } catch {
        // ошибка уже лежит
        // в agents.create.error()
      }
    };

  return (
    <section
      className="home-page"
    >
      <header
        className={
          "home-page__header"
        }
      >

        <div>
          <h1>HOME</h1>

          <p>
            {hasAgents
              ? "Recent activity and system overview"
              : "Welcome to Флекс BUILDER"}
          </p>
        </div>
      </header>

      <div
        className={
          "home-page__placeholder"
        }
      >
        {hasAgents ? (
          <>
            <h2>
              WELCOME BACK
            </h2>

            <p>
              You have{" "}
              {
                identities.length
              }{" "}
              configured agents.
            </p>
          </>
        ) : (
          <>
            <p>
              Create your
              first specialized
              AI agent and start
              a new task.
            </p>

            <button
              type="button"
              disabled={
                !createReady
              }
              onClick={() => {
                void handleCreateAgent();
              }}
            >
              {createReady
                ? "▤ CREATE FIRST AGENT"
                : "▤ CREATING..."}
            </button>

            {createError && (
              <div
                role="alert"
                className={
                  "home-page__error"
                }
              >
                {
                  createError.message
                }
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
});