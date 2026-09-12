import { z } from 'zod'

export type ToolContext = {
    callId: string;
    signal?: AbortSignal;
};

export type Tool<
    TInput = unknown,
> = {
    name: string;
    description: string;
    inputSchema: z.ZodType<TInput>;

    execute(
        args: TInput,
        context: ToolContext,
    ): Promise<unknown>;
};

export type ToolRegistry = Tool[];