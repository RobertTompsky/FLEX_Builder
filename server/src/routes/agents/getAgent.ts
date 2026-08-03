import { Elysia } from "elysia";
import type {
  AgentStore,
} from "../../agents/store/store";
import { AgentParamsSchema } from "../schemas";
import { toUIMessages, UIMessage } from "../../agents/shared/utils/messages";
import { AgentIdentity } from "../../agents/shared/schemas";
import { AgentState, AgentCheckpoint } from "../../agents/store/checkpointer";

export type UIAgentState =
  Omit<
    AgentState,
    "messages"
  > & {
    messages: UIMessage[];
  };

export type UIAgentCheckpoint =
  Omit<
    AgentCheckpoint,
    "data"
  > & {
    data:
    Omit<
      AgentCheckpoint["data"],
      "state"
    > & {
      state: UIAgentState;
    };
  };

export type AgentUISnapshot = {
  identity: AgentIdentity;
  checkpoint: UIAgentCheckpoint;
};

export function getAgentRoute(
  store: AgentStore,
) {
  return new Elysia().get(
    "/:agentId",
    async ({
      params: { agentId },
      set,
    }) => {
      const snapshot = await store.get(agentId);

      if (!snapshot) {
        set.status = 404;

        return {
          ok: false,
          error: "Agent not found",
        };
      }

      const result: AgentUISnapshot = {
        identity:
          snapshot.identity,

        checkpoint: {
          ...snapshot.checkpoint,

          data: {
            ...snapshot.checkpoint.data,

            state: {
              ...snapshot
                .checkpoint
                .data
                .state,

              messages:
                toUIMessages(
                  snapshot
                    .checkpoint
                    .data
                    .state
                    .messages,
                ),
            },
          },
        },
      };

      return result;
    },
    {
      params: AgentParamsSchema,
    },
  );
}