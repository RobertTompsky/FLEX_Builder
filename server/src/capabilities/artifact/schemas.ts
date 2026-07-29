import path from "path";
import { z } from "zod";

export const SafeFilePathSchema = z
    .string()
    .min(1)
    .refine(
        (value) =>
            !path.isAbsolute(value),
        "Absolute paths are not allowed",
    )
    .refine(
        (value) =>
            !value
                .split(/[\\/]+/)
                .includes(".."),
        'Path segment ".." is not allowed',
    );