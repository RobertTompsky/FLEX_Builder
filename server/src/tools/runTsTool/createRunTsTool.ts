import {
    randomUUID,
} from "crypto";

import {
    CapabilityEvent,
    CodeGenSchema,
} from "@flex-builder/shared/capabilities";

import type {
    ExecutionEvent,
    ExecutionSource,
    SandboxEvent,
} from "@flex-builder/shared/sandbox";

import type {
    Tool,
} from "../../services/tools/types";

import type {
    Workspace,
} from "../../services/workspace/types";

import type {
    Capability,
} from "../../services/capabilities/types";

import type {
    SandboxRunResult,
} from "../../services/sandbox/types";

import {
    createExecutor,
} from "../../services/execute/executor";

import type {
    RunTsRuntime,
} from "./types";

import {
    z,
} from "zod";
import { withConcurrencyLimit } from "../../services/execute/semaphore";

type SandboxEventHandler = (
    event: SandboxEvent,
) =>
    | void
    | Promise<void>;

type CreateRunTsToolInput = {
    runId: string;
    workspace: Workspace;
    description: string;
    capabilities: Capability[];
    maxExecuteConcurrency: number;
    runtime: RunTsRuntime;
    onEvent?: SandboxEventHandler;
};

const DEFAULT_TIMEOUT_MS = 90_000;

export function createRunTsTool({
    runId,
    workspace,
    description,
    capabilities,
    maxExecuteConcurrency,
    runtime: {
        sandbox,
        executions,
    },

    onEvent,
}: CreateRunTsToolInput): Tool<
    z.infer<typeof CodeGenSchema>
> {
    return {
        name: "runTs",
        description,
        inputSchema: CodeGenSchema,

        async execute(
            input,
            context,
        ) {
            const executionId = `exec_${randomUUID()}`;

            const source: ExecutionSource = {
                runId,
                toolCallId: context.callId,
                executionId,
            };

            const emitExecutionEvent = async (event: ExecutionEvent) => {
                await onEvent?.({
                    ...event,
                    source,
                });
            };

            const emitCapabilityEvent = async (event: CapabilityEvent) => {
                await onEvent?.({
                    ...event,
                    source,
                });
            };

            const execute = createExecutor({
                capabilities,
                emit: emitCapabilityEvent,
            });

            const executeTestDelayMs = Number(
                process.env.EXECUTE_TEST_DELAY_MS
                ?? 0
            );

            const limitedExecute = withConcurrencyLimit(
                execute,
                maxExecuteConcurrency,
                Number.isFinite(executeTestDelayMs)
                    ? executeTestDelayMs
                    : 0,
            );

            executions.register(
                executionId,
                limitedExecute,
                emitExecutionEvent,
            );

            try {
                await emitExecutionEvent({
                    event: "rpc_trace",

                    data: {
                        phase: "request",
                        method: "sandbox/run",
                        client: "server",
                        server: "sandbox",
                    },
                });

                const result =
                    await sandbox.run(
                        {
                            executionId,
                            code: input.code,
                            cwd: workspace.root,
                            timeoutMs:
                                DEFAULT_TIMEOUT_MS,
                        },
                        {
                            signal:
                                context.signal,
                        },
                    );

                return {
                    stdout:
                        formatSandboxResult(
                            result,
                        ),
                };

            } finally {
                executions.delete(
                    executionId,
                );
            }
        },
    };
}

function formatSandboxResult(
    result: SandboxRunResult,
): string {
    const output: string[] = [];

    const stdout = result.stdout.trimEnd();

    const stderr = result.stderr.trimEnd();

    if (stdout) output.push(stdout);

    if (stderr) output.push(`[STDERR] ${stderr}`);

    if (result.timedOut) {
        output.push("[TIMEOUT] Sandbox execution timed out");
    } else if (result.exitCode !== 0) {
        output.push(`[EXIT_CODE] ${result.exitCode}`);
    }

    return output.join("\n");
}