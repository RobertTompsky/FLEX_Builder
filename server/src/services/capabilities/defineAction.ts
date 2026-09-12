import z from "zod";

import type {
    CapabilityExecutionContext,
    EmptyContext,
    RuntimeAction,
} from "./types";

type DefineActionInput<
    TInputSchema extends z.ZodType,
    TOutputSchema extends z.ZodType,
    TContext extends CapabilityExecutionContext =
        EmptyContext,
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
            TContext,
    ) =>
        | z.input<TOutputSchema>
        | Promise<
            z.input<TOutputSchema>
        >;
};

export function defineAction<
    TInputSchema extends z.ZodType,
    TOutputSchema extends z.ZodType,
    TContext extends CapabilityExecutionContext =
        EmptyContext,
>({
    description,
    inputSchema,
    outputSchema,
    handler,
}: DefineActionInput<
    TInputSchema,
    TOutputSchema,
    TContext
>): RuntimeAction<TContext> {
    return {
        description,
        inputSchema,
        outputSchema,

        async execute(
            rawArgs,
            context,
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