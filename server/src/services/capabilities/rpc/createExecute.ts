import { executeInputSchema, executeOutputSchema } from "../schemas";
import { RuntimeExecute } from "../types";

type ExecuteCallOptions = {
    signal?: AbortSignal;
};

export type ExecuteCall = (
    action: string,
    args: unknown,
    options?: ExecuteCallOptions,
) => Promise<unknown>;

export function createExecute(
    call: ExecuteCall,
): RuntimeExecute {
    return async function execute(
        rawInput,
        options,
    ) {
        const {
            action,
            args,
        } =
            executeInputSchema.parse(
                rawInput,
            );

        const result =
            await call(
                action,
                args,
                options,
            );

        return executeOutputSchema.parse(
            result,
        );
    };
}