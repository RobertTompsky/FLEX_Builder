import path from "path";
import { z } from "zod";

const SafeFilePathSchema = z
    .string()
    .min(1)
    .refine(
        (value) => !path.isAbsolute(value),
        "Absolute paths are not allowed",
    );

const BaseArtifactSchema = z.object({
    filePath: SafeFilePathSchema,
    report: z.string().min(1),
});

export const ArtifactSchema = z.discriminatedUnion("type", [
    BaseArtifactSchema.extend({
        type: z.literal("create"),
        description: z.string().min(1).optional(),
        content: z.string().min(1),
    }),

    BaseArtifactSchema.extend({
        type: z.literal("read"),
    }),
]);

export const ArtifactOutputSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("create"),
        filePath: z.string(),
    }),

    z.object({
        type: z.literal("read"),
        filePath: z.string(),
        content: z.string(),
    }),
]);