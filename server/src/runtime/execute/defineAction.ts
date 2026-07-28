import z from "zod";

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
        ) {
            const args =
                inputSchema.parse(
                    rawArgs,
                );

            const result =
                await handler(
                    args,
                );

            return outputSchema.parse(
                result,
            );
        },
    };
}