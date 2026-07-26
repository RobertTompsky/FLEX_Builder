import { writeFile, unlink } from "fs-extra";
import path from "path";
import { SRC_DIR } from "../shared/data";
import { RUNTIME_EVENT_PREFIX, type RuntimeEvent } from "../events";
import { RuntimeGlobal } from "../runtime/globals/types";
import { validateCode } from "./validateCode";

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

export async function executeCode(
  code: string,
  timeoutSeconds = 10,
  globals: RuntimeGlobal[] = [],
  onRuntimeEvent?: (
    event: RuntimeEvent,
  ) => void | Promise<void>,
) {
  const userFile = path.join(
    SRC_DIR,
    `.sandbox-${Date.now()}-${Math.random().toString(36).slice(2)}.ts`,
  );

  const entryFile = path.join(SRC_DIR, "runtime", "sandbox-entry.ts");

  const logs: string[] = [];

  try {
    const error = validateCode(code, globals);
    if (error) {
      return { stdout: `[BLOCKED] ${error}` };
    }

    await writeFile(userFile, code, "utf8");

    const child = Bun.spawn(["bun", entryFile, userFile, JSON.stringify(globals)], {
      cwd: SRC_DIR,
      stdout: "pipe",
      stderr: "pipe",
      env: sandboxEnv,
    });

    const timeout = setTimeout(() => child.kill(), timeoutSeconds * 1000);

    let totalBytes = 0;

    const stdoutTextChunks: string[] = [];
    const stderrChunks: Uint8Array[] = [];

    const handleStdoutLine = async (line: string) => {
      if (!line.startsWith(RUNTIME_EVENT_PREFIX)) {
        if (line) {
          stdoutTextChunks.push(line);
        }

        return;
      }

      const raw = line.slice(RUNTIME_EVENT_PREFIX.length);

      try {
        const event = JSON.parse(raw) as RuntimeEvent;
        await onRuntimeEvent?.(event);
      } catch (error) {
        console.error(
          "[RUNTIME EVENT ERROR]",
          error,
          raw,
        );
      }
    };

    const stdoutTask = (async () => {
      if (!child.stdout) return;

      const decoder = new TextDecoder();
      let buffer = "";

      for await (const chunk of child.stdout) {
        totalBytes += chunk.byteLength;

        if (totalBytes > MAX_OUTPUT_BYTES) {
          child.kill();
          break;
        }

        const decoded = decoder.decode(chunk, {
          stream: true,
        });

        // console.log(
        //   "[PARENT RAW STDOUT]",
        //   JSON.stringify(decoded),
        // );

        buffer += decoded;

        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          // console.log("[PARENT STDOUT LINE]", JSON.stringify(line));
          await handleStdoutLine(line);
        }
      }

      buffer += decoder.decode();

      if (buffer) {
        await handleStdoutLine(buffer);
      }
    })();

    const stderrTask = (async () => {
      if (!child.stderr) return;

      for await (const chunk of child.stderr) {
        totalBytes += chunk.byteLength;
        stderrChunks.push(chunk);

        if (totalBytes > MAX_OUTPUT_BYTES) {
          child.kill();
          break;
        }
      }
    })();

    await Promise.all([
      stdoutTask,
      stderrTask,
      child.exited,
    ]);
    clearTimeout(timeout);

    const stdoutText = stdoutTextChunks.join("\n").trimEnd();

    const stderrText = Buffer
      .concat(stderrChunks)
      .toString("utf8")
      .trimEnd();

    if (stdoutText) logs.push(stdoutText);
    if (stderrText) logs.push(`[STDERR] ${stderrText}`);

    if (totalBytes > MAX_OUTPUT_BYTES) {
      logs.push(`[TRUNCATED] Output exceeded ${MAX_OUTPUT_BYTES} bytes`);
    }

    if (child.exitCode !== 0) {
      if (child.signalCode) {
        logs.push(`[TIMEOUT] Exceeded ${timeoutSeconds}s`);
      } else {
        logs.push(`[EXIT_CODE] ${child.exitCode}`);
      }
    }
  } catch (e: any) {
    logs.push(`[ERROR] ${e?.message ?? String(e)}`);
  } finally {
    await unlink(userFile).catch(() => { });
  }

  return { stdout: logs.join("\n") };
}