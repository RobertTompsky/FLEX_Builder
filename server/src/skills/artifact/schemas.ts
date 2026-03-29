import path from "path";
import z from "zod";

export const ReadSchema = z.object({
    filePath: z
        .string()
        .min(1)
        .refine(
            (value) => !path.isAbsolute(value) && !value.includes(".."),
            "Unsafe artifact path"
        ),
    report: z.string().min(1),
});

export const WriteSchema = ReadSchema.extend({
    description: z.string().min(1).optional(),
    content: z.string(),
});