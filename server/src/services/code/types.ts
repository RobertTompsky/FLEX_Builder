import { CodeExecutionEvent } from "./events";

export type CodeExecutionInput = {
    code: string;
    timeoutSeconds?: number;
    signal?: AbortSignal;
    onEvent?: (
        event: CodeExecutionEvent,
    ) => void | Promise<void>;
};
export type CodeExecutionOutput = {
    stdout: string;
};