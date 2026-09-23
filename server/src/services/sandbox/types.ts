import { ExecutionRegistry } from "../execute/executionRegistry";
import { SandboxRpcClient } from "./rpc/client";

export type SandboxRunInput = {
    executionId: string
    
    code: string;
    cwd?: string;
    timeoutMs?: number;
};

export type SandboxRunResult = {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    timedOut: boolean;
};

export type SandboxExecutionRuntime = {
    client: SandboxRpcClient;
    executions: ExecutionRegistry;
};