import { CapabilityEvent } from '../capabilities'
import { ExecutionSource } from './types'

export type CodeExecutionEvent =
    | {
        event: "started";
        data: {
            pid: number;
        };
    }
    | {
        event: "timeout";
        data: {
            timeoutMs: number;
        };
    }
    | {
        event: "output_exceeded";
        data: {
            maxOutputBytes: number;
        };
    }
    | {
        event: "exit";
        data: {
            exitCode: number | null;
        };
    };


export type SandboxEvent =
    (
        | CodeExecutionEvent
        | CapabilityEvent
    ) & {
        source: ExecutionSource;
    };