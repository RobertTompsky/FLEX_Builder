import z from "zod";

import type {
    Action,
    ActionInput,
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

    execute(
        input: ActionInput<
            z.output<TInputSchema>
        >,
    ):
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
    execute,
}: DefineActionInput<
    TInputSchema,
    TOutputSchema
>): Action {
    return {
        description,
        inputSchema,
        outputSchema,

        async execute({
            args,
            options,
        }) {
            const parsedArgs =
                inputSchema.parse(
                    args,
                );

            const result =
                await execute({
                    args:
                        parsedArgs,

                    options,
                });

            return outputSchema.parse(
                result,
            );
        },
    };
}