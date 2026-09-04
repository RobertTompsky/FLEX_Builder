import {
  createAgent,
  deleteAgent,
  getAgent,
  listAgents,
  updateAgent,
} from "./queries";

import type {
  Agent,
  AgentConfig,
  AgentListItem,
} from "@flex-builder/shared/agent";

export interface AgentRepository {
  get(
    agentId: string,
  ): Promise<Agent | undefined>;

  list(): Promise<AgentListItem[]>;

  create(
    agent: Agent,
  ): Promise<Agent>;

  update(
    agentId: string,
    config: AgentConfig,
  ): Promise<Agent | undefined>;

  delete(
    agentId: string,
  ): Promise<boolean>;
}

export const agentRepository: AgentRepository = {
  get: getAgent,
  list: listAgents,
  create: createAgent,
  update: updateAgent,
  delete: deleteAgent,
};