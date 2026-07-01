import z from "zod";

export type RuntimeAction = {
  description: string;
  inputSchema: z.ZodType;
  execute: (rawArgs: unknown) => Promise<unknown>;
};

export type SkillActions = Record<string, RuntimeAction>;

export type LoadedSkill = {
  id: string;
  description: string;
  access: "public" | "private";
  actions: SkillActions;
};

export type ExecuteInput = {
  action: string;
  args?: unknown;
};

export type RuntimeExecute = (
  input: ExecuteInput,
) => Promise<unknown>;