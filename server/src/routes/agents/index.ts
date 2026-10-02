import { Elysia } from "elysia";
import { createAgentRoute } from "./createAgent";
import { listAgentsRoute } from "./listAgents";
import { getAgentRoute } from "./getAgent";
import { deleteAgentRoute } from "./deleteAgent";
import { updateAgentRoute } from "./updateAgent";
import { createChatRoute } from "./createChat";
import { RouteDeps } from "../types";
import { stopRunRoute } from "./runs/stopRun";
import { startRunRoute } from "./runs/startRun";

export function agentsRoutes(
  deps: RouteDeps,
) {
  const {
    chatRepository,
    runRepository,
    runRegistry,
    agentRepository,
    executionService,
    sandboxService,
    capabilityRepository,
    workspaceStore
  } = deps;

  return new Elysia({
    prefix: "/agents",
  })
    .use(
      createAgentRoute({
        agentRepository
      }),
    )
    .use(
      createChatRoute({
        agentRepository,
        chatRepository,
        workspaceStore
      })
    )
    .use(
      listAgentsRoute({
        agentRepository
      }),
    )
    .use(
      getAgentRoute({
        agentRepository,
        capabilityRepository,
        chatRepository
      }),
    )
    .use(
      updateAgentRoute({
        agentRepository,
        capabilityRepository
      }),
    )
    .use(
      deleteAgentRoute({
        workspaceStore,
        agentRepository,
      }),
    )
    .use(startRunRoute({
      capabilityRepository,
      chatRepository,
      runRegistry,
      runRepository,
      agentRepository,
      executionService,
      sandboxService,
      workspaceStore
    }))
    .use(stopRunRoute({
      runRegistry,
      agentRepository
    }))
}