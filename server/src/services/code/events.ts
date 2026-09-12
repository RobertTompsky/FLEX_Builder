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

// export function createStdoutEmitter<
//     TEvent extends {
//         event: string;
//         data: unknown;
//     },
// >() {
//     return (
//         event: TEvent,
//     ): void => {
//         process.stdout.write(
//             `${SANDBOX_EVENT_PREFIX}${JSON.stringify(event)}\n`,
//         );
//     };
// }