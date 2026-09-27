import { RunRegistry } from "../services/runs/runs";
import { WorkspaceStore } from "../services/workspace/store";
import { AgentRepository } from "../db/agents";
import { CapabilityRepository } from "../db/capabilities";
import { ChatRepository } from "../db/chats";
import type { SandboxService } from "../services/sandbox/service";
import { ExecutionService } from "../services/execute";
import { RunRepository } from "../db/runs";

export type RouteDeps = {
    workspaceStore: WorkspaceStore;
    runRegistry: RunRegistry;
    agentRepository: AgentRepository;
    capabilityRepository: CapabilityRepository;
    chatRepository: ChatRepository;
    runRepository: RunRepository;
    sandboxService: SandboxService
    executionService: ExecutionService
};