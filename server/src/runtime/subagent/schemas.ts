import z from "zod";

export const SubagentInputSchema = z.object({
    query: z
        .string()
        .min(1)
        .describe("A clear, self-contained task for the subagent."),

    skills: z
        .array(z.string().min(1))
        .min(1)
        .describe("Names of skills to grant to the subagent."),
});

export const SubagentOutputSchema = z.object({
    text: z.string(),
});