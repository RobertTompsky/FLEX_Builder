import { z } from "zod";

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