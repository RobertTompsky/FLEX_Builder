import { z } from 'zod'
import { AgentIdentitySchema } from '../agents/shared/schemas';

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

export const CreateAgentBodySchema =
  AgentIdentitySchema.pick({
    name: true,
  });

export type CreateAgentBody = z.infer<
  typeof CreateAgentBodySchema
>;