import { Elysia } from "elysia";
import { createAgentRoute } from "./createAgent";
import { listAgentsRoute } from "./listAgents";
import { getAgentRoute } from "./getAgent";
import { deleteAgentRoute } from "./deleteAgent";
import { executeAgentRoute } from "./executeAgent";
import { stopAgentRoute } from "./stopAgent";
import { updateAgentRoute } from "./updateAgent";
// import { approveToolCallsRoute } from "./approveToolcalls";
import { createChatRoute } from "./createChat";
import { RouteDeps } from "../types";

export function agentsRoutes(
  deps: RouteDeps,
) {
  const {
    workspaceStore,
    runStore,
    agentRepository,
    capabilityRepository,
    chatRepository
  } = deps;

  return new Elysia({
    prefix: "/agents",
  })
    .use(
      createAgentRoute({
        workspaceStore,
        agentRepository
      }),
    )
    .use(
      createChatRoute({
        agentRepository,
        chatRepository
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
    .use(
      executeAgentRoute({
        runStore,
        capabilityRepository,
        chatRepository,
        agentRepository
      }),
    )
    // .use(
    //   approveToolCallsRoute({
    //     conversationRepository
    //   }),
    // )
    .use(
      stopAgentRoute({
        agentRepository,
        runStore,
      }),
    );
}