import { z } from "zod";

export const CodeGenSchema = z.object({
    code: z.string()
        .min(1)
        .max(10_000, "Code is too large")
})

export const CapabilityAccessSchema =
    z.enum([
        "execute",
        "delegate",
        "both",
    ]);

export const AgentCapabilityConfigSchema =
    z.object({
        id: z
            .string()
            .min(1),

        access: CapabilityAccessSchema,
    });