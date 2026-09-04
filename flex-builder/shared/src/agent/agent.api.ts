import { z } from 'zod'
import { AgentConfigSchema, AgentIdentitySchema } from './agent.schemas';
import { AgentCapabilityConfig, CapabilityAccess } from '../capabilities/capabilities.types';
import { HookPoliciesInfo } from '../hooks/hooks.types';
import { Agent, AgentSnapshot, UIAgentSnapshot, UIMessage } from './agent.types';
import { AgentCapabilityConfigSchema } from '../capabilities/cababilities.schemas';
import { Chat, ChatParamsSchema } from '../chat';

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

export const ExecuteAgentParamsSchema = AgentParamsSchema.extend(ChatParamsSchema.shape)

export const ExecuteAgentBodySchema =
    AgentConfigSchema.extend({
        capabilities: z
            .array(AgentCapabilityConfigSchema)
            .superRefine(
                (
                    capabilities,
                    context,
                ) => {
                    const seen = new Set<string>();

                    for (
                        const [
                            index,
                            capability,
                        ]
                        of capabilities.entries()
                    ) {
                        if (seen.has(capability.id,)) {
                            context.addIssue({
                                code: "custom",
                                path: [
                                    index,
                                    "id",
                                ],
                                message: `Duplicate capability id "${capability.id}"`,
                            });

                            continue;
                        }

                        seen.add(capability.id,);
                    }
                },
            ),
        query: z.string().nullable(),
        files: z.array(z.string()).optional(),
    });

export type ExecuteAgentBody = z.infer<typeof ExecuteAgentBodySchema>

export const UpdateAgentBodySchema = z.object({
    name: AgentIdentitySchema.shape.name,
    config: AgentConfigSchema,
    capabilities: z.array(AgentCapabilityConfigSchema)
});

export type UpdateAgentBody =
    z.infer<typeof UpdateAgentBodySchema>;

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

export type GetAgentResponse = Agent & {
    capabilities: AgentCapabilityConfig[]
    chats: Chat[];
};;

export type UpdateAgentResponse = Omit<GetAgentResponse, 'chats'>;
