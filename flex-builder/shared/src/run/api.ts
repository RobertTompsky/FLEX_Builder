import { z } from "zod";

import {
    AgentParamsSchema,
} from "../agent";

import {
    ChatParamsSchema,
} from "../chat";

import {
    AgentConfigSchema,
} from "../agent/agent.schemas";

import {
    AgentCapabilityConfigSchema,
} from "../capabilities/cababilities.schemas";

export const RunParamsSchema = z.object({
    runId: z.string().min(1),
});

export type RunParams = z.infer<typeof RunParamsSchema>;

export const StartRunParamsSchema = AgentParamsSchema.extend(
    ChatParamsSchema.shape,
);

export type StartRunParams =
    z.infer<
        typeof StartRunParamsSchema
    >;

export const StopRunParamsSchema = StartRunParamsSchema.extend(
    RunParamsSchema.shape,
);

export type StopRunParams =
    z.infer<
        typeof StopRunParamsSchema
    >;

export const StartRunBodySchema = AgentConfigSchema.extend({
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
                    ] of capabilities.entries()
                ) {
                    if (seen.has(capability.id)) {
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

                    seen.add(capability.id);
                }
            },
        ),
    query: z.string().nullable(),
    files: z.array(z.string()).optional(),
    maxExecuteConcurrency: z
        .number()
        .int()
        .min(1)
        .max(8)
        .optional(),
});

export type StartRunBody =
    z.infer<
        typeof StartRunBodySchema
    >;

export const ApproveToolCallsBodySchema =
    z.object({
        approvedToolCallIds:
            z.array(z.string()),
    });

export type ApproveToolCallsBody =
    z.infer<
        typeof ApproveToolCallsBodySchema
    >;

export type ApproveToolCallsResponse = {
    ok: true;
    approvedToolCallIds: string[];
};