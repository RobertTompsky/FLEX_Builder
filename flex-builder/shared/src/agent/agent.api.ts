import { z } from 'zod'
import { AgentCheckpointConfigSchema } from './agent.schemas';
import { CapabilityAccess } from '../capabilities/capabilities.types';
import { HookPoliciesInfo } from '../hooks/hooks.types';
import { AgentSnapshot, UIAgentCheckpoint } from './agent.types';

export const AgentParamsSchema = z.object({
    agentId: z.string().min(1),
});

export type AgentParams = z.infer<
    typeof AgentParamsSchema
>;

export const AgentRunParamsSchema = AgentParamsSchema.extend({
    runId: z.string().min(1),
});

export type AgentRunParams = z.infer<
    typeof AgentRunParamsSchema
>;

export const ToolCallsParamsSchema = AgentParamsSchema.extend({
    requestId: z.string().min(1),
});

export type ToolCallsParams = z.infer<
    typeof ToolCallsParamsSchema
>;

export const ToolCallsBodySchema = z.object({
    approvedToolCallIds: z.array(z.string()),
})

export type ToolCallsBody = z.infer<typeof ToolCallsBodySchema>

export const ExecuteAgentBodySchema =
    AgentCheckpointConfigSchema.extend({
        query: z.string().nullable(),
        files: z.array(z.string()).optional(),
    });

export type ExecuteAgentBody = z.infer<typeof ExecuteAgentBodySchema>

export const UpdateAgentBodySchema = z.object({
    name: z
        .string()
        .min(1),
    config: AgentCheckpointConfigSchema,
});

export type UpdateAgentBody = z.infer<typeof UpdateAgentBodySchema>

export type MetadataResponse = {
    uploads: string[];

    models: {
        readonly luna: "gpt-5.6-luna";
        readonly terra: "gpt-5.6-terra";
    };

    capabilities: {
        items: Array<{
            id: string;
            description: string;
        }>;

        accessOptions:
        readonly CapabilityAccess[];
    };

    policies: HookPoliciesInfo;
};

export type GetAgentResponse =
    AgentSnapshot<
        UIAgentCheckpoint | null
    >;

export type UpdateAgentResponse =
    AgentSnapshot<
        UIAgentCheckpoint
    >;
