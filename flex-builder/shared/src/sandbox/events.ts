import type { CapabilityEvent } from "../capabilities";
import type { ExecutionSource } from "./types";

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

export type RpcTraceCall =
    | {
        method:
            "sandbox/run";

        client:
            "server";

        server:
            "sandbox";
    }
    | {
        method:
            "execute";

        client:
            "execution";

        server:
            "server";

        capability:
            string;

        action:
            string;
    };

export type RpcTraceEvent = {
    event:
        "rpc_trace";

    data:
        RpcTraceCall & {
            phase:
                "request"
                | "response";

            requestId?:
                string;

            executionId?:
                string;
        };
};

export type ExecutionEvent =
    | CodeExecutionEvent
    | RpcTraceEvent;

export type ExecutionEventInput = {
    executionId: string;
    event: ExecutionEvent;
};

export type SandboxEvent =
    (
        ExecutionEvent
        | CapabilityEvent
    ) & {
        source: ExecutionSource;
    };