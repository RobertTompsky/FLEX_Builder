import z from "zod";
import { executeInputSchema, executeOutputSchema } from "./schemas";

export type RuntimeAction = {
  description: string;
  inputSchema: z.ZodType;
  outputSchema: z.ZodType;
  execute: (rawArgs: unknown) => Promise<unknown>;
};

export type SkillActions = Record<string, RuntimeAction>;

export type LoadedSkill = {
  id: string;
  description: string;
  access: "public" | "private";
  actions: SkillActions;
};

export type ExecuteInput = z.infer<typeof executeInputSchema>;

export type ExecuteOutput = z.infer<typeof executeOutputSchema>;

export type RuntimeExecute = (
    input: ExecuteInput,
) => Promise<ExecuteOutput>;