import { z } from "zod";
import { HookPolicySelectionSchema } from "../hooks/hooks.schemas";
import { AgentCapabilityConfigSchema } from "../capabilities/cababilities.schemas";

export const AgentIdentitySchema = z.object({
    id: z.string().min(1),
    name: z
        .string()
        .trim()
        .min(1, "Agent name is required"),
});

export const AgentCheckpointConfigSchema =
    z.object({
        model: z.string(),
        prompt: z.string(),

        maxTurns: z
            .number()
            .int()
            .positive(),

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

        policies: HookPolicySelectionSchema,
    });
