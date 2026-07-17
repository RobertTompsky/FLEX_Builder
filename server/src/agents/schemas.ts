import { z } from "zod";
import { AgentCheckpoint } from "./utils/checkpointer";

export const AgentIdentitySchema = z.object({
  id: z.string().min(1),

  name: z
    .string()
    .trim()
    .min(1, "Agent name is required"),
});

export type AgentIdentity = z.infer<
  typeof AgentIdentitySchema
>;

export const AgentCheckpointConfigSchema = z.object({
  model: z.string(),
  prompt: z.string(),

  toolRounds: z
    .number()
    .int()
    .positive(),

  globals: z.array(z.string()),
  skills: z.array(z.string()),
  pause: z.boolean(),
});

export type AgentCheckpointConfig = z.infer<
  typeof AgentCheckpointConfigSchema
>;

export type AgentSnapshot = {
  identity: AgentIdentity;
  checkpoint: AgentCheckpoint;
};

export const CreateAgentBodySchema =
  AgentIdentitySchema.pick({
    name: true,
  });

export type CreateAgentBody = z.infer<
  typeof CreateAgentBodySchema
>;

export const AgentRegistrySchema = z.array(
  AgentIdentitySchema,
);

export const DEFAULT_AGENT_CHECKPOINT_CONFIG:
  AgentCheckpointConfig = {
    model: "",
    prompt: "",
    toolRounds: 3,
    globals: [],
    skills: [],
    pause: false,
  };

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