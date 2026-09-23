import { RunStore } from "../agents/store/runs";
import { WorkspaceStore } from "../services/workspace/store";
import { AgentRepository } from "../db/agents";
import { CapabilityRepository } from "../db/capabilities";
import { ChatRepository } from "../db/chats";
import type { SandboxService } from "../services/sandbox/service";

export type RouteDeps = {
    workspaceStore: WorkspaceStore;
    runStore: RunStore;
    agentRepository: AgentRepository;
    capabilityRepository: CapabilityRepository;
    chatRepository: ChatRepository;
    sandboxService: SandboxService
};