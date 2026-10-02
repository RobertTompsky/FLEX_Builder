import Elysia from "elysia";

import {
  type AgentSSEMessage,
} from "@flex-builder/shared/agent";

import {
  streamSSE,
  createSSEWriter,
} from "../../../sse";
import { RouteDeps } from "../../types";
import { StopRunParamsSchema } from "@flex-builder/shared/run";

type StopAgentRouteDeps = Pick<
  RouteDeps,
  'runRegistry' | "agentRepository"
>

export function stopRunRoute(
  deps: StopAgentRouteDeps,
) {
  return new Elysia().post(
    "/:agentId/chats/:chatId/runs/:runId/stop",
    async ({
      params: {
        agentId,
        chatId,
        runId,
      },
      set,
    }) => {
      const agent = await deps.agentRepository.get(agentId);

      if (!agent) {
        set.status = 404;

        return {
          ok: false,
          error: "Agent not found",
        };
      }

      const controller = deps.runRegistry.get(agentId, chatId, runId);

      if (!controller) {
        set.status = 409;

        return {
          ok: false,
          error: "Nothing to stop",
        };
      }

      controller.abort();

      return streamSSE(async (sse) => {
        const writeAgentSSE = createSSEWriter<AgentSSEMessage>(sse);

        await writeAgentSSE({
          event: "status",
          data: {
            agent: agent.identity,
            data: {
              runId,
              status: 'stopped',
              reason: "user_requested",
            },
          },
        });
      });
    },
    {
      params: StopRunParamsSchema,
    },
  );
}