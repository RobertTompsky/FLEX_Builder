import { Elysia } from "elysia";
import type { AgentStore } from "../../agents/store/store";
import { createAgentRoute } from "./createAgent";
import { listAgentsRoute } from "./listAgents";
import { getAgentRoute } from "./getAgent";
import { deleteAgentRoute } from "./deleteAgent";
import { RunStore } from "../../agents/store/runs";
import { executeAgentRoute } from "./executeAgent";
import { stopAgentRoute } from "./stopAgent";
import { updateAgentRoute } from "./updateAgent";
import { approveToolCallsRoute } from "./approveToolcalls";

export function agentsRoutes(
  agentStore: AgentStore,
  runStore: RunStore,
) {
  return new Elysia({
    prefix: "/agents",
  })
    .use(createAgentRoute(agentStore))
    .use(listAgentsRoute(agentStore))
    .use(getAgentRoute(agentStore))
    .use(updateAgentRoute(agentStore))
    .use(deleteAgentRoute(agentStore))
    .use(executeAgentRoute(
      agentStore,
      runStore,
    ))
    .use(approveToolCallsRoute(agentStore))
    .use(stopAgentRoute(
      agentStore,
      runStore,
    ));
}