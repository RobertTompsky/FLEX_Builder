import { Elysia } from "elysia";
import {
  AgentParamsSchema,
} from "../../agents/schemas";
import type {
  AgentStore,
} from "../../agents/store";
import { toUIMessages } from "../../agents/utils/toUIMessages";

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

      return {
        identity: snapshot.identity,

        checkpoint: {
          ...snapshot.checkpoint,

          data: {
            ...snapshot.checkpoint.data,

            messages: toUIMessages(
              snapshot.checkpoint.data.messages,
            ),
          },
        },
      };
    },
    {
      params: AgentParamsSchema,
    },
  );
}