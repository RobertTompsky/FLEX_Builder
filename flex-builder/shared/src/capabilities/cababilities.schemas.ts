import { z } from "zod";

export const CapabilityAccessValues = [
  "execute",
  "orchestrate",
  "both",
] as const;

export const CodeGenSchema = z.object({
    code: z.string()
        .min(1)
        .max(10_000, "Code is too large")
})

export const CapabilityAccessSchema =
    z.enum(CapabilityAccessValues);

export const AgentCapabilityConfigSchema =
    z.object({
        id: z
            .string()
            .min(1),

        access: CapabilityAccessSchema,
    });