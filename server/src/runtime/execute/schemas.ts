import z from "zod";

export const executeInputSchema = z.object({
    action: z
        .string()
        .describe("Full action name"),

    args: z
        .record(z.string(), z.unknown())
        .describe("Arguments for the selected action."),
});

export const executeOutputSchema = z
    .unknown()
    .describe(
        "Successful output of the selected action. Exact shape depends on that action output schema.",
    );