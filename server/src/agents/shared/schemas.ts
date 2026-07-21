import { z } from "zod";
import { AgentCheckpoint } from "./utils/checkpointer";
import { ResponseInputItem } from "openai/resources/responses/responses.js";
import { RuntimeGlobal } from "../../runtime/types";

export const CodeGenSchema = z.object({
  code: z.string()
    .min(1)
    .max(10_000, "Code is too large")
})

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

export type AgentRunConfig = {
  messages: ResponseInputItem[],
  model: string
  globals?: RuntimeGlobal[];
  pause?: boolean,
  opts?: {
    toolRounds?: number
    sandboxTimeout?: number,
    signal?: AbortSignal,
  }
}

export type AgentRunResult = Pick<AgentRunConfig, "messages">;