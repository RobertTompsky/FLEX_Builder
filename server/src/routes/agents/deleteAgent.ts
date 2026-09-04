import { Elysia } from "elysia";

import {
  AgentParamsSchema,
} from "@flex-builder/shared/agent";
import { RouteDeps } from "../types";

type DeleteAgentRouteDeps = Pick<
  RouteDeps,
  "workspaceStore" | "agentRepository"
>

export function deleteAgentRoute(
  deps: DeleteAgentRouteDeps,
) {
  return new Elysia().delete(
    "/:agentId",
    async ({
      params: { agentId },
      set,
    }) => {
      const {
        agentRepository,
        workspaceStore,
      } = deps;

      const agent =
        await agentRepository.get(agentId);

      if (!agent) {
        set.status = 404;

        return {
          ok: false,
          error: "Agent not found",
        };
      }

      await workspaceStore.delete(agentId);

      await agentRepository.delete(agentId);

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