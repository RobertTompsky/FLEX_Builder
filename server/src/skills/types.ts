import z from "zod";

export type Action = {
  description: string;
  inputSchema: z.ZodType;
  handler: (args: unknown) => Promise<unknown> | unknown;
};