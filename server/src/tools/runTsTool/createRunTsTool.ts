import {
    CapabilityEvent,
    CodeGenSchema,
} from "@flex-builder/shared/capabilities";

import type {
    Tool,
} from "../../services/tools/types";

import type {
    Workspace,
} from "../../services/workspace/types";

import { z } from "zod";

import {
    validateCode,
} from "../../services/code/validateCode";
import { SandboxExecutionRuntime, SandboxRunResult } from "../../services/sandbox/types";
import { ExecutionSource, SandboxEvent } from "@flex-builder/shared/sandbox";
import { createExecutor } from "../../services/execute/executor";
import { Capability } from "../../services/capabilities/types";

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
    runtime: SandboxExecutionRuntime;
    onEvent?: SandboxEventHandler;
};

const DEFAULT_TIMEOUT_MS = 90_000;

export function createRunTsTool({
    runId,
    workspace,
    description,
    capabilities,
runtime: { client, executions },
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
            const validationError = validateCode(input.code);

            if (validationError) {
                return {
                    stdout: `[BLOCKED] ${validationError}`,
                };
            }

            const source: ExecutionSource = {
                runId,
                toolCallId: context.callId,
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

            const executionId = executions.register(execute);

            try {
                const result = await client.run(
                    {
                        executionId,
                        code: input.code,
                        cwd: workspace.root,
                        timeoutMs: DEFAULT_TIMEOUT_MS,
                    },

                    {
                        signal: context.signal,
                    },
                );

                return {
                    stdout: formatSandboxResult(result),
                };
            } finally {
                executions.delete(executionId);
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