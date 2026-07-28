export function validateCode(
  code: string,
): string | null {
  const allowedImportSpecifiers = [
    /^['"]fs['"]$/,
    /^['"]path['"]$/,
  ];

  const importPattern =
    /(?:import|from)\s+(['"][^'"]+['"])/g;

  const blockedPatterns = [
    {
      pattern:
        /\bchild_process\b/,

      reason:
        "child_process is blocked",
    },
    {
      pattern:
        /\bBun\.spawn\b/,

      reason:
        "Bun.spawn is blocked",
    },
    {
      pattern:
        /\bBun\.write\b/,

      reason:
        "Bun.write is blocked",
    },
    {
      pattern:
        /\bprocess\.exit\b/,

      reason:
        "process.exit is blocked",
    },
    {
      pattern:
        /\bprocess\.env\b/,

      reason:
        "process.env is blocked",
    },
    {
      pattern:
        /\beval\s*\(/,

      reason:
        "eval is blocked",
    },
    {
      pattern:
        /\bFunction\s*\(/,

      reason:
        "Function() is blocked",
    },
    {
      pattern:
        /\bfetch\s*\(/,

      reason:
        "fetch is blocked (use execute)",
    },
    {
      pattern:
        /\bwriteFile\b/,

      reason:
        "writeFile is blocked",
    },
    {
      pattern:
        /\bunlink\b/,

      reason:
        "unlink is blocked",
    },
    {
      pattern:
        /\brmSync\b/,

      reason:
        "rmSync is blocked",
    },
  ];

  for (
    const line
    of code.split(
      /\r?\n/,
    )
  ) {
    const importMatches =
      line
        .trim()
        .match(
          importPattern,
        );

    if (!importMatches) {
      continue;
    }

    for (
      const match
      of importMatches
    ) {
      const specifier =
        match.replace(
          /^(?:import|from)\s+/,
          "",
        );

      const allowed =
        allowedImportSpecifiers.some(
          (pattern) =>
            pattern.test(
              specifier,
            ),
        );

      if (!allowed) {
        return `Blocked import: ${specifier}`;
      }
    }
  }

  for (
    const {
      pattern,
      reason,
    }
    of blockedPatterns
  ) {
    if (
      pattern.test(
        code,
      )
    ) {
      return reason;
    }
  }

  return null;
}