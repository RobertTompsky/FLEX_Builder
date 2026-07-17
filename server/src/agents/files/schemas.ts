import { z } from "zod";

export const AgentFileSchema = z.object({
  id: z.string().min(1),

  name: z
    .string()
    .trim()
    .min(1),

  storedName: z.string().min(1),

  size: z
    .number()
    .int()
    .nonnegative(),

  mimeType: z.string(),

  createdAt: z.number(),
});

export type AgentFile = z.infer<
  typeof AgentFileSchema
>;

export const AgentFilesSchema = z.array(
  AgentFileSchema,
);

export const DeleteAgentFilesBodySchema = z.object({
  fileIds: z.array(z.string().min(1)),
});