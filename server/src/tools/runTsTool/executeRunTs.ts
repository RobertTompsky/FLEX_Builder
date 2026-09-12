import { unlink, writeFile } from "fs-extra";
import { Workspace } from "../../services/workspace/types";
import { validateCode } from "../../services/code/validateCode";
import { randomUUID } from 'crypto'
import path from 'path'
import { createCapabilityRpcServer } from "../../services/capabilities/rpc/server";
import { executeProcess } from "../../services/code/process/executeProcess";
import { createSandboxEventProtocol } from "../../services/code/process/sandboxEventProtocol";
import { createSandboxEnv } from "../../services/code/env";
import { SandboxEvent } from "./types";

type ExecuteRunTsInput = {
    code: string;

    workspace:
    Workspace;

    signal?:
    AbortSignal;

    executeCapability: (
        action: string,
        args: unknown,
    ) => Promise<unknown>;

    onEvent?: (
        event: SandboxEvent,
    ) => void | Promise<void>;
};

const DEFAULT_TIMEOUT_SECONDS = 90;

const MAX_OUTPUT_BYTES = 1_000_000;

export async function executeRunTs({
    code,
    workspace,
    signal,
    executeCapability,
    onEvent,
}: ExecuteRunTsInput): Promise<{
    stdout: string;
}> {
    const validationError = validateCode(code);

    if (validationError) {
        return {
            stdout: `[BLOCKED] ${validationError}`,
        };
    }

    const userFile =
        path.join(
            workspace.root,
            `.sandbox-${randomUUID()}.ts`,
        );

    const entryFile =
        path.join(
            import.meta.dir,
            "../../services/capabilities/sandbox-entry.ts",
        );

    try {
        await writeFile(
            userFile,
            code,
            "utf8",
        );

        let process: ReturnType<typeof executeProcess>;

        const handleRpc = createCapabilityRpcServer({
            execute: ({ action, args }) => executeCapability(action, args),
            writeLine: async (line) => await process.writeLine(line),
            signal
        });

        const handleEvent = createSandboxEventProtocol({ onEvent });

        process = executeProcess({
            command: [
                "bun",
                entryFile,
                userFile,
            ],
            cwd: workspace.root,
            env: createSandboxEnv(),
            timeoutMs: DEFAULT_TIMEOUT_SECONDS * 1000,
            maxOutputBytes: MAX_OUTPUT_BYTES,
            signal,
            onEvent: async (event) => {
                await onEvent?.(
                    event,
                );
            },
            onStdout: async (line) => {
                const rpcResult = await handleRpc(line);

                if (rpcResult === undefined) {
                    return undefined;
                }

                return handleEvent(rpcResult);
            },
        });

        const result = await process.result;

        return {
            stdout: formatProcessResult(result),
        };
    } catch (error) {
        if (
            signal?.aborted
        ) {
            throw error;
        }

        const message = error instanceof Error
            ? error.message
            : String(error);

        return {
            stdout: `[ERROR] ${message}`,
        };
    } finally {
        await unlink(userFile).catch(() => { });
    }
}

function formatProcessResult(
    result: {
        stdout: string;
        stderr: string;
        exitCode: number | null;
        timedOut: boolean;
        outputExceeded: boolean;
    },
): string {
    const output: string[] = [];

    const stdout = result.stdout.trimEnd();

    const stderr = result.stderr.trimEnd();

    if (stdout) {
        output.push(stdout);
    }

    if (stderr) {
        output.push(`[STDERR] ${stderr}`);
    }

    if (result.outputExceeded) {
        output.push(
            `[TRUNCATED] Output exceeded ${MAX_OUTPUT_BYTES} bytes`,
        );
    }

    if (result.timedOut) {
        output.push(
            `[TIMEOUT] Exceeded ${DEFAULT_TIMEOUT_SECONDS}s`,
        );
    } else if (
        result.exitCode !== 0 &&
        !result.outputExceeded
    ) {
        output.push(`[EXIT_CODE] ${result.exitCode}`);
    }

    return output.join("\n");
}