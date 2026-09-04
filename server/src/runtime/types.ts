import { AgentRunParamsSchema } from '@flex-builder/shared/agent';
import z from 'zod'

export type AgentRuntimeContext = z.infer<typeof AgentRunParamsSchema> & {
    workspaceRoot: string;
}

export type RuntimeContext = AgentRuntimeContext & {
    toolCallId: string;
}

export type SandboxRuntimeConfig = {
    capabilityIds: string[];
    context: RuntimeContext
};