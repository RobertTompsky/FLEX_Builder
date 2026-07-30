import { writeFile, unlink } from "fs-extra";
import path from "path";
import { SRC_DIR } from "../shared/data";
import { RUNTIME_EVENT_PREFIX, type RuntimeEvent } from "../events";
import { validateCode } from "./validateCode";
import { RuntimeContext, SandboxRuntimeConfig } from "../runtime/types";

const MAX_OUTPUT_BYTES = 50 * 1024; // 50 KB

const ENV_WHITELIST = [
  "PATH", "PATHEXT", "SYSTEMROOT", "TEMP", "TMP",
  "HOMEDRIVE", "HOMEPATH", "USERPROFILE",
  "APPDATA", "LOCALAPPDATA", "COMSPEC",
  "TAVILY_API_KEY", "OPENAI_API_KEY"
];

export const sandboxEnv: Record<string, string> = {};

for (const key of ENV_WHITELIST) {
  const val = process.env[key];
  if (val) sandboxEnv[key] = val;
}

export type ExecuteCodeInput = {
  code: string;
  timeoutSeconds?: number;
  runtimeConfig: SandboxRuntimeConfig;
  onRuntimeEvent?: (
    event: RuntimeEvent,
  ) => void | Promise<void>;
};

export type ExecuteCodeResult = {
  stdout: string;
};

export async function executeCode({
  code,
  timeoutSeconds = 10,
  runtimeConfig,
  onRuntimeEvent,
}: ExecuteCodeInput): Promise<ExecuteCodeResult> {
  const normalizedRuntimeConfig:
    SandboxRuntimeConfig = {
    ...runtimeConfig,

    capabilityIds: [
      ...new Set(
        runtimeConfig.capabilityIds,
      ),
    ],
  };

  const userFile =
    path.join(
      SRC_DIR,
      `.sandbox-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.ts`,
    );

  const entryFile =
    path.join(
      SRC_DIR,
      "runtime",
      "sandbox-entry.ts",
    );

  const logs: string[] = [];

  let timedOut = false;
  let outputExceeded = false;

  try {
    const validationError = validateCode(code);

    if (validationError) {
      return {
        stdout: `[BLOCKED] ${validationError}`,
      };
    }

    await writeFile(
      userFile,
      code,
      "utf8",
    );

    const child =
      Bun.spawn(
        [
          "bun",
          entryFile,
          userFile,
          JSON.stringify(normalizedRuntimeConfig),
        ],
        {
          cwd: SRC_DIR,
          stdout: "pipe",
          stderr: "pipe",
          env: sandboxEnv,
        },
      );

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutSeconds * 1000);

    let totalBytes = 0;

    const stdoutTextChunks: string[] = [];

    const stderrChunks: Uint8Array[] = [];

    const handleStdoutLine = async (line: string,): Promise<void> => {
      if (!line.startsWith(RUNTIME_EVENT_PREFIX,)) {
        if (line) {
          stdoutTextChunks.push(line,);
        }

        return;
      }

      const raw = line.slice(RUNTIME_EVENT_PREFIX.length,);

      try {
        const event = JSON.parse(raw,) as RuntimeEvent;

        await onRuntimeEvent?.(event,);
      } catch (error) {
        console.error(
          "[RUNTIME EVENT ERROR]",
          error,
          raw,
        );
      }
    };

    const registerBytes = (
      byteLength: number,
    ): boolean => {
      totalBytes +=
        byteLength;

      if (totalBytes <= MAX_OUTPUT_BYTES) {
        return true;
      }

      outputExceeded = true;

      child.kill();

      return false;
    };

    const stdoutTask = (async () => {
      if (!child.stdout) {
        return;
      }

      const decoder = new TextDecoder();

      let buffer = "";

      for await (const chunk of child.stdout) {
        if (!registerBytes(chunk.byteLength)) {
          break;
        }

        buffer += decoder.decode(
          chunk,
          {
            stream: true,
          },
        );

        const lines = buffer.split(/\r?\n/,);

        buffer = lines.pop() ?? "";

        for (const line of lines) {
          await handleStdoutLine(
            line,
          );
        }
      }

      buffer += decoder.decode();

      if (buffer) {
        await handleStdoutLine(buffer,);
      }
    })();

    const stderrTask = (async () => {
      if (!child.stderr) {
        return;
      }

      for await (const chunk of child.stderr) {
        if (!registerBytes(chunk.byteLength,)) {
          break;
        }

        stderrChunks.push(chunk,);
      }
    })();

    try {
      await Promise.all([
        stdoutTask,
        stderrTask,
        child.exited,
      ]);
    } finally {
      clearTimeout(timeout,);
    }

    const stdoutText = stdoutTextChunks
      .join("\n")
      .trimEnd();

    const stderrText = Buffer
      .concat(stderrChunks,)
      .toString("utf8",)
      .trimEnd();

    if (stdoutText) {
      logs.push(stdoutText,);
    }

    if (stderrText) {
      logs.push(
        `[STDERR] ${stderrText}`,
      );
    }

    if (outputExceeded) {
      logs.push(
        `[TRUNCATED] Output exceeded ${MAX_OUTPUT_BYTES} bytes`,
      );
    }

    if (timedOut) {
      logs.push(`[TIMEOUT] Exceeded ${timeoutSeconds}s`,);
    } else if (
      child.exitCode !== 0 &&
      !outputExceeded
    ) {
      logs.push(`[EXIT_CODE] ${child.exitCode}`,);
    }
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : String(error);

    logs.push(`[ERROR] ${message}`,);
  } finally {
    await unlink(userFile).catch(() => { },
    );
  }

  return {
    stdout: logs.join("\n"),
  };
}