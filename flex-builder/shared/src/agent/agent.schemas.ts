import { z } from "zod";
import { HookPolicySelectionSchema } from "../hooks/hooks.schemas";

export const AgentIdentitySchema = z.object({
    id: z.string().min(1),
    name: z
        .string()
        .trim()
        .min(1, "Agent name is required"),
});

export const AgentConfigSchema =
    z.object({
        model: z.string(),
        prompt: z.string(),

        maxTurns: z
            .number()
            .int()
            .positive(),

        policies: HookPolicySelectionSchema,
    });
