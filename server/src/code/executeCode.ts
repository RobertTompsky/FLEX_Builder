import { writeFile, unlink } from "fs-extra";
import path from "path";
import { SKILLS_DIR, SRC_DIR } from "../data";

const MAX_OUTPUT_BYTES = 50 * 1024; // 50 KB

const ENV_WHITELIST = [
  "PATH", "PATHEXT", "SYSTEMROOT", "TEMP", "TMP",
  "HOMEDRIVE", "HOMEPATH", "USERPROFILE",
  "APPDATA", "LOCALAPPDATA", "COMSPEC",
  "TAVILY_API_KEY",
];

const sandboxEnv: Record<string, string> = {};

for (const key of ENV_WHITELIST) {
  const val = process.env[key];
  if (val) sandboxEnv[key] = val;
}

function validateCode(code: string, allowedSkills: string[]): string | null {
  const allowedSet = new Set(allowedSkills.map((s) => s.trim()).filter(Boolean));
  const skillsRel = "./" + path.relative(SRC_DIR, SKILLS_DIR).split(path.sep).join("/");
  const escapedSkillsRel = skillsRel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const allowedImportSpecifiers = [/^['"]fs['"]$/, /^['"]path['"]$/];
  const importPattern = /(?:import|from)\s+(['"][^'"]+['"])/g;
  const allowedSkillImportPattern = new RegExp(
    `^['"]${escapedSkillsRel}/([^/'"]+)/.+['"]$`
  );

  const fsReadPattern =
    /\b(?:readFileSync|readdirSync|statSync|existsSync)\s*\(\s*['"](?<filePath>[^'"]+)['"]/g;
  const allowedFsPathPattern = new RegExp(`^${escapedSkillsRel}/([^/]+)/.+`);

  const blockedPatterns = [
    { pattern: /\bchild_process\b/, reason: "child_process is blocked" },
    { pattern: /\bBun\.spawn\b/, reason: "Bun.spawn is blocked" },
    { pattern: /\bBun\.write\b/, reason: "Bun.write is blocked" },
    { pattern: /\bprocess\.exit\b/, reason: "process.exit is blocked" },
    { pattern: /\beval\s*\(/, reason: "eval is blocked" },
    { pattern: /\bFunction\s*\(/, reason: "Function() is blocked" },
    { pattern: /\bfetch\s*\(/, reason: "fetch is blocked (use skills)" },
    { pattern: /\bwriteFile\b/, reason: "writeFile is blocked" },
    { pattern: /\bunlink\b/, reason: "unlink is blocked" },
    { pattern: /\brmSync\b/, reason: "rmSync is blocked" },
  ];

  for (const line of code.split(/\r?\n/)) {
    const importMatches = line.trim().match(importPattern);
    if (!importMatches) continue;

    for (const match of importMatches) {
      const specifier = match.replace(/^(?:import|from)\s+/, "");
      if (allowedImportSpecifiers.some((re) => re.test(specifier))) continue;

      const skillImport = specifier.match(allowedSkillImportPattern);
      if (skillImport) {
        const skillName = skillImport[1];
        if (allowedSet.has(skillName)) continue;
        return `Blocked import from disallowed skill: ${skillName}`;
      }

      return `Blocked import: ${specifier}`;
    }
  }

  for (const match of code.matchAll(fsReadPattern)) {
    const filePath = match.groups?.filePath;
    if (!filePath) continue;
    const skillPath = filePath.match(allowedFsPathPattern);
    if (!skillPath) return `Blocked fs path: ${filePath}`;

    const skillName = skillPath[1];
    if (!allowedSet.has(skillName)) {
      return `Blocked fs access to disallowed skill: ${skillName}`;
    }
  }

  for (const { pattern, reason } of blockedPatterns) {
    if (pattern.test(code)) return reason;
  }

  return null;
}

export async function executeCode(
  code: string,
  timeoutSeconds = 10,
  allowedSkills: string[] = []
) {
  const file = path.join(
    SRC_DIR,
    `.sandbox-${Date.now()}-${Math.random().toString(36).slice(2)}.ts`
  );

  const logs: string[] = [];

  try {
    const error = validateCode(code, allowedSkills);
    if (error) {
      return { stdout: `[BLOCKED] ${error}` };
    }

    await writeFile(file, code, "utf8");

    const child = Bun.spawn(["bun", file], {
      cwd: SRC_DIR,
      stdout: "pipe",
      stderr: "pipe",
      env: sandboxEnv,
    });

    const timeout = setTimeout(() => child.kill(), timeoutSeconds * 1000);

    let totalBytes = 0;
    const stdoutChunks: Uint8Array[] = [];
    const stderrChunks: Uint8Array[] = [];

    const streams: Array<
      [ReadableStream<Uint8Array> | null | undefined, Uint8Array[]]
    > = [
        [child.stdout, stdoutChunks],
        [child.stderr, stderrChunks],
      ];

    const streamTasks = streams.map(([stream, chunks]) =>
      (async () => {
        if (!stream) return;
        for await (const chunk of stream) {
          totalBytes += chunk.byteLength;
          chunks.push(chunk);
          if (totalBytes > MAX_OUTPUT_BYTES) {
            child.kill();
            break;
          }
        }
      })()
    );

    await Promise.all([...streamTasks, child.exited]);
    clearTimeout(timeout);

    const decode = (chunks: Uint8Array[]) =>
      Buffer.concat(chunks).toString("utf8").trimEnd();

    const stdoutText = decode(stdoutChunks);
    const stderrText = decode(stderrChunks);

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
    await unlink(file).catch(() => { });
  }

  return { stdout: logs.join("\n") };
}
