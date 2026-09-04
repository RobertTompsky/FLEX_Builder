import Elysia from "elysia";

import {
  AgentRunParamsSchema,
  type AgentSSEMessage,
  type AgentIdentity,
} from "@flex-builder/shared/agent";

import {
  streamSSE,
  createSSEWriter,
} from "../../sse";
import { RouteDeps } from "../types";

type StopAgentRouteDeps = Pick<RouteDeps, 'runStore' | "agentRepository">

export function stopAgentRoute(
  deps: StopAgentRouteDeps,
) {
  return new Elysia().post(
    "/:agentId/runs/:runId/stop",
    async ({
      params: {
        agentId,
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

      const controller = deps.runStore.get(agentId, runId);

      if (!controller) {
        set.status = 409;

        return {
          ok: false,
          error: "Nothing to stop",
        };
      }

      controller.abort();

      return sendStopEvent({
        identity: agent.identity,
        reason: "live_abort",
      });
    },
    {
      params: AgentRunParamsSchema,
    },
  );
}

function sendStopEvent({
  identity,
  reason,
}: {
  identity: AgentIdentity;
  reason: "live_abort";
}) {
  return streamSSE(async (sse) => {
    const writeAgentSSE = createSSEWriter<AgentSSEMessage>(sse);

    await writeAgentSSE({
      event: "stop",
      data: {
        agent: identity,
        data: {
          reason,
        },
      },
    });
  });
}