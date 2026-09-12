import { CodeExecutionEvent } from "../events";

export type ExecuteProcessInput = {
    command: string[];
    cwd?: string;
    env?: Record<string, string>;
    timeoutMs?: number;
    maxOutputBytes?: number;
    signal?: AbortSignal;
    
    onEvent?: (
        event: CodeExecutionEvent,
    ) => void | Promise<void>;

    onStdout?: (
        line: string,
    ) =>
        | string
        | undefined
        | Promise<string | undefined>;
};

export type ExecuteProcessOutput = {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    timedOut: boolean;
    outputExceeded: boolean;
};

export type RunningProcess = {
    writeLine(
        line: string,
    ): Promise<void>;

    result: Promise<ExecuteProcessOutput>;
};

