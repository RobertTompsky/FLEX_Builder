export function validateCode(
  code: string,
): string | null {
  const blockedPatterns = [
    {
      pattern:
        /\bimport\s*(?:\(|[\s{*"'])/,
      reason:
        "Imports are blocked",
    },

    {
      pattern:
        /\brequire\s*\(/,
      reason:
        "require() is blocked",
    },

    {
      pattern:
        /\bBun\b/,
      reason:
        "Bun APIs are blocked",
    },

    {
      pattern:
        /\bprocess\.env\b/,
      reason:
        "process.env is blocked",
    },

    {
      pattern:
        /\bprocess\.exit\b/,
      reason:
        "process.exit is blocked",
    },

    {
      pattern:
        /\bfetch\s*\(/,
      reason:
        "fetch is blocked (use execute)",
    },

    {
      pattern:
        /\bWebSocket\b/,
      reason:
        "WebSocket is blocked (use execute)",
    },

    {
      pattern:
        /\bEventSource\b/,
      reason:
        "EventSource is blocked (use execute)",
    },

    {
      pattern:
        /\beval\s*\(/,
      reason:
        "eval() is blocked",
    },

    {
      pattern:
        /\bFunction\s*\(/,
      reason:
        "Function() is blocked",
    },
  ];

  for (
    const {
      pattern,
      reason,
    } of blockedPatterns
  ) {
    if (pattern.test(code)
    ) {
      return reason;
    }
  }

  return null;
}