import z from "zod";

import type {
    RuntimeContext,
} from "../types";

import type {
    RuntimeAction,
} from "./types";

type DefineActionInput<
    TInputSchema extends z.ZodType,
    TOutputSchema extends z.ZodType,
> = {
    description: string;

    inputSchema:
        TInputSchema;

    outputSchema:
        TOutputSchema;

    handler: (
        args:
            z.output<TInputSchema>,

        context:
            RuntimeContext,
    ) =>
        | z.input<TOutputSchema>
        | Promise<
            z.input<TOutputSchema>
        >;
};

export function defineAction<
    TInputSchema extends z.ZodType,
    TOutputSchema extends z.ZodType,
>({
    description,
    inputSchema,
    outputSchema,
    handler,
}: DefineActionInput<
    TInputSchema,
    TOutputSchema
>): RuntimeAction {
    return {
        description,
        inputSchema,
        outputSchema,

        async execute(
            rawArgs: unknown,
            context: RuntimeContext,
        ) {
            const args =
                inputSchema.parse(
                    rawArgs,
                );

            const result =
                await handler(
                    args,
                    context,
                );

            return outputSchema.parse(
                result,
            );
        },
    };
}