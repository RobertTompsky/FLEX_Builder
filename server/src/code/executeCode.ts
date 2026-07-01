import { writeFile, unlink } from "fs-extra";
import path from "path";
import { SKILLS_DIR, SRC_DIR } from "../data";
import { RUNTIME_EVENT_PREFIX, type RuntimeEvent } from "../runtime/events";
import { RuntimeGlobal } from "../runtime/types";

const MAX_OUTPUT_BYTES = 50 * 1024; // 50 KB

const ENV_WHITELIST = [
  "PATH", "PATHEXT", "SYSTEMROOT", "TEMP", "TMP",
  "HOMEDRIVE", "HOMEPATH", "USERPROFILE",
  "APPDATA", "LOCALAPPDATA", "COMSPEC",
  "TAVILY_API_KEY", "OPENAI_API_KEY"
];

const sandboxEnv: Record<string, string> = {};

for (const key of ENV_WHITELIST) {
  const val = process.env[key];
  if (val) sandboxEnv[key] = val;
}

function hasGlobal(
  globals: RuntimeGlobal[],
  name: RuntimeGlobal["name"],
) {
  return globals.some((global) => global.name === name);
}

export function validateCode(
  code: string,
  globals: RuntimeGlobal[],
): string | null {
  const allowedImportSpecifiers = [
    /^['"]fs['"]$/,
    /^['"]path['"]$/,
  ];

  const importPattern = /(?:import|from)\s+(['"][^'"]+['"])/g;

  const blockedPatterns = [
    { pattern: /\bchild_process\b/, reason: "child_process is blocked" },
    { pattern: /\bBun\.spawn\b/, reason: "Bun.spawn is blocked" },
    { pattern: /\bBun\.write\b/, reason: "Bun.write is blocked" },
    { pattern: /\bprocess\.exit\b/, reason: "process.exit is blocked" },
    { pattern: /\bprocess\.env\b/, reason: "process.env is blocked" },
    { pattern: /\beval\s*\(/, reason: "eval is blocked" },
    { pattern: /\bFunction\s*\(/, reason: "Function() is blocked" },
    { pattern: /\bfetch\s*\(/, reason: "fetch is blocked (use execute)" },
    { pattern: /\bwriteFile\b/, reason: "writeFile is blocked" },
    { pattern: /\bunlink\b/, reason: "unlink is blocked" },
    { pattern: /\brmSync\b/, reason: "rmSync is blocked" },
  ];

  for (const line of code.split(/\r?\n/)) {
    const importMatches = line.trim().match(importPattern);

    if (!importMatches) continue;

    for (const match of importMatches) {
      const specifier = match.replace(/^(?:import|from)\s+/, "");

      if (allowedImportSpecifiers.some((re) => re.test(specifier))) {
        continue;
      }

      return `Blocked import: ${specifier}`;
    }
  }

  if (!hasGlobal(globals, "artifact") && /\bartifact\s*\(/.test(code)) {
    return "artifact is not available in this runtime";
  }

  if (!hasGlobal(globals, "execute") && /\bexecute\s*\(/.test(code)) {
    return "execute is not available in this runtime";
  }

  for (const { pattern, reason } of blockedPatterns) {
    if (pattern.test(code)) {
      return reason;
    }
  }

  return null;
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