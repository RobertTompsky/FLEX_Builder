export type RuntimeContext = {
    agentId: string;
    runId: string;
    requestId: string;
    workspaceRoot: string;
};

export type SandboxRuntimeConfig = {
  capabilityIds: string[];
  context: RuntimeContext
};