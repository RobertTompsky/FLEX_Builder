import { Elysia } from "elysia";

import type {
  AgentStore,
} from "../../agents/store";

import {
  createAgentRoute,
} from "./createAgent";

import {
  listAgentsRoute,
} from "./listAgents";

import {
  getAgentRoute,
} from "./getAgent";

import {
  deleteAgentRoute,
} from "./deleteAgent";
import { RunStore } from "../../agents/runs";
import { executeAgentRoute } from "./executeAgent";

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
    .use(deleteAgentRoute(agentStore))
    .use(
      executeAgentRoute(
        agentStore,
        runStore,
      ),
    );
}