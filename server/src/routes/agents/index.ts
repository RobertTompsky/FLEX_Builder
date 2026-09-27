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
    runRegistry,
    agentRepository,
    capabilityRepository,
    chatRepository,
    sandboxService,
    executionService,
    runRepository
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
    .use(
      executeAgentRoute({
        workspaceStore,
        runRegistry,
        capabilityRepository,
        chatRepository,
        agentRepository,
        sandboxService,
        executionService,
        runRepository
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
        runRegistry,
      }),
    );
}