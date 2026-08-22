import { reatomComponent } from "@reatom/react";
import { agents } from "../../model/agents";

export const HomePage = reatomComponent(() => {
  const identities = agents.list.data()
  const hasAgents = identities.length > 0

  return (
    <section className="home-page">
      <header className="home-page__header">
        <span
          className="home-page__icon"
          aria-hidden="true"
        >
          ⌂
        </span>

        <div>
          <h1>HOME</h1>

          <p>
            {hasAgents
              ? "Recent activity and system overview"
              : "Welcome to Agent Workspace"}
          </p>
        </div>
      </header>

      <div className="home-page__placeholder">
        {hasAgents ? (
          <>
            <h2>WELCOME BACK</h2>
            <p>
              You have {identities.length} configured
              agents.
            </p>
          </>
        ) : (
          <>
            <h2>WELCOME TO AGENT WORKSPACE</h2>

            <p>
              Create your first specialized AI agent
              and start a new task.
            </p>

            <button type="button">
              ▤ CREATE FIRST AGENT
            </button>
          </>
        )}
      </div>
    </section>
  );
}
)