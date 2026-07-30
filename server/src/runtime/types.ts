export type AgentRuntimeContext = {
    agentId: string;
    runId: string;
    requestId: string;
    workspaceRoot: string;
};

export type RuntimeContext = {
    agentId: string;
    runId: string;
    requestId: string;
    workspaceRoot: string;
    toolCallId: string;
};

export type SandboxRuntimeConfig = {
  capabilityIds: string[];
  context: RuntimeContext
};