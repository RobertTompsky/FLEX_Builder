import type {
  AgentCapabilityConfig,
} from "@flex-builder/shared/capabilities";

import {
  deleteCapabilitiesByAgentId,
  getCapabilitiesByAgentId,
  setCapabilitiesForAgent,
} from "./queries";

export interface CapabilityRepository {
  getByAgentId(
    agentId: string,
  ): Promise<AgentCapabilityConfig[]>;

  setForAgent(
    agentId: string,
    capabilities:
      AgentCapabilityConfig[],
  ): Promise<void>;

  deleteByAgentId(
    agentId: string,
  ): Promise<void>;
}

export const capabilityRepository = {
  getByAgentId:
    getCapabilitiesByAgentId,

  setForAgent:
    setCapabilitiesForAgent,

  deleteByAgentId:
    deleteCapabilitiesByAgentId,
} satisfies CapabilityRepository;