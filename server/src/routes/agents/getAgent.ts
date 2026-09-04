import { Elysia } from "elysia";

import {
  AgentParamsSchema,
  GetAgentResponse,
} from "@flex-builder/shared/agent";

import { RouteDeps } from "../types";

type GetAgentRouteDeps = Pick<
  RouteDeps,
  'agentRepository' | 'capabilityRepository' | 'chatRepository'
>

export function getAgentRoute(
  deps: GetAgentRouteDeps,
) {
  return new Elysia().get(
    "/:agentId",
    async ({
      params: { agentId },
      set,
    }) => {
      const {
        agentRepository,
        capabilityRepository,
        chatRepository,
      } = deps;

      const agent = await agentRepository.get(agentId);
      console.log(agent)
      if (!agent) {
        set.status = 404;

        return {
          ok: false,
          error: "Agent not found",
        };
      }

      const capabilities = await capabilityRepository.getByAgentId(agentId);

      const chats = await chatRepository.listChatsByAgentId(agentId,);

      return {
        ...agent,
        capabilities,
        chats,
      } satisfies GetAgentResponse;
    },
    {
      params: AgentParamsSchema,
    },
  );
}