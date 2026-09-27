import { ExecutionRegistry } from "../../services/execute/executionRegistry";
import { SandboxRpcClient } from "../../services/sandbox/rpc/client";

export type RunTsRuntime = {
    sandbox: SandboxRpcClient;
    executions: ExecutionRegistry;
};