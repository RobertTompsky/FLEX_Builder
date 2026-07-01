import z from "zod";
import type { RuntimeAction } from "./types";

type DefineActionInput<
  TSchema extends z.ZodType,
  TResult,
> = {
  description: string;
  inputSchema: TSchema;
  handler: (
    args: z.output<TSchema>,
  ) => Promise<TResult> | TResult;
};

export function defineAction<
  TSchema extends z.ZodType,
  TResult,
>({
  description,
  inputSchema,
  handler,
}: DefineActionInput<TSchema, TResult>): RuntimeAction {
  return {
    description,
    inputSchema,

    async execute(rawArgs: unknown) {
      const args = inputSchema.parse(rawArgs);

      return handler(args);
    },
  };
}