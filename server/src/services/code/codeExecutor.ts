import path from "node:path";

import {
    writeFile,
    unlink,
} from "fs-extra";

import {
    validateCode,
} from "./validateCode";

import {
    createSandboxEnv,
} from "./env";

import {
    executeProcess,
} from "./process/executeProcess";

import type {
    CodeExecutionInput,
    CodeExecutionOutput,
} from "./types";
import { createSandboxEventProtocol } from "./process/sandboxEventProtocol";

const DEFAULT_TIMEOUT_SECONDS = 90;

const MAX_OUTPUT_BYTES =
    1_000_000;

export async function codeExecutor({
    code,
    timeoutSeconds =
    DEFAULT_TIMEOUT_SECONDS,
    signal,
    onEvent,
}: CodeExecutionInput): Promise<CodeExecutionOutput> {
    const validationError = validateCode(code);

    if (validationError) {
        return {
            stdout: `[BLOCKED] ${validationError}`,
        };
    }

    const userFile = path.join(
        import.meta.dir,
        `.sandbox-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}.ts`,
    );

    const entryFile = path.join(import.meta.dir, "sandbox-entry.ts");

    try {
        await writeFile(
            userFile,
            code,
            "utf8",
        );

        const handleStdout = createSandboxEventProtocol({ onEvent });

        const process =
            executeProcess({
                command: [
                    "bun",
                    entryFile,
                    userFile,
                ],
                cwd: import.meta.dir,
                env: createSandboxEnv(),
                timeoutMs: timeoutSeconds * 1000,
                maxOutputBytes: MAX_OUTPUT_BYTES,
                signal,
                onStdout: handleStdout,
            });

        const result = await process.result;

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
            output.push(`[TIMEOUT] Exceeded ${timeoutSeconds}s`);
        } else if (
            result.exitCode !== 0 &&
            !result.outputExceeded
        ) {
            output.push(`[EXIT_CODE] ${result.exitCode}`);
        }

        return {
            stdout: output.join("\n"),
        };
    } catch (error) {
        const message = error instanceof Error
            ? error.message
            : String(error);

        return {
            stdout: `[ERROR] ${message}`,
        };
    } finally {
        await unlink(
            userFile,
        ).catch(() => { });
    }
}