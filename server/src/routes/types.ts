import { RunStore } from "../agents/store/runs";
import { WorkspaceStore } from "../agents/store/store";
import { AgentRepository } from "../db/agents";
import { CapabilityRepository } from "../db/capabilities";
import { ChatRepository } from "../db/chats";

export type RouteDeps = {
    workspaceStore: WorkspaceStore;
    runStore: RunStore;
    agentRepository: AgentRepository;
    capabilityRepository: CapabilityRepository;
    chatRepository: ChatRepository;
};