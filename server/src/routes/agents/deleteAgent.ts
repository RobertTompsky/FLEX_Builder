import { Elysia } from "elysia";

import type {
  AgentStore,
} from "../../agents/store/store";
import { AgentParamsSchema } from "../schemas";

export function deleteAgentRoute(
  store: AgentStore,
) {
  return new Elysia().delete(
    "/:agentId",
    async ({
      params: { agentId },
      set,
    }) => {
      const deleted = await store.delete(agentId);

      if (!deleted) {
        set.status = 404;

        return {
          ok: false,
          error: "Agent not found",
        };
      }

      return {
        ok: true,
        agentId,
      };
    },
    {
      params: AgentParamsSchema,
    },
  );
}