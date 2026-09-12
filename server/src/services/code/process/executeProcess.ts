import { ExecuteProcessInput, ExecuteProcessOutput, RunningProcess } from "./types";

export function executeProcess({
  command,
  cwd,
  env,
  timeoutMs = 90_000,
  maxOutputBytes = 1_000_000,
  signal,
  onEvent,
  onStdout,
}: ExecuteProcessInput): RunningProcess {

  const child = Bun.spawn(
    command,
    {
      cwd,
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
      env,
    },
  );

  onEvent?.({
    event: "started",
    data: {
      pid: child.pid,
    },
  });

  const result = (async (): Promise<ExecuteProcessOutput> => {
    let timedOut = false;
    let outputExceeded = false;
    let totalBytes = 0;

    const stdoutLines: string[] = [];
    const stderrChunks: Uint8Array[] = [];

    const registerBytes = (
      size: number,
    ): boolean => {
      totalBytes += size;

      if (totalBytes <= maxOutputBytes) {
        return true;
      }

      if (
        totalBytes >
        maxOutputBytes
      ) {
        outputExceeded = true;

        onEvent?.({
          event:
            "output_exceeded",
          data: {
            maxOutputBytes,
          },
        });

        child.kill();

        return false;
      }

      outputExceeded = true;
      child.kill();

      return false;
    };

    const handleStdoutLine = async (
      line: string,
    ): Promise<void> => {
      const outputLine =
        onStdout
          ? await onStdout(line)
          : line;

      if (outputLine !== undefined) {
        stdoutLines.push(outputLine);
      }
    };

    const stdoutTask = (async () => {
      const decoder = new TextDecoder();

      let buffer = "";

      for await (const chunk of child.stdout) {
        if (!registerBytes(chunk.byteLength,)) {
          break;
        }

        buffer += decoder.decode(
          chunk,
          {
            stream: true,
          },
        );

        const lines = buffer.split(/\r?\n/);

        buffer = lines.pop() ?? "";

        for (const line of lines) {
          await handleStdoutLine(
            line,
          );
        }
      }

      buffer += decoder.decode();

      if (buffer) {
        await handleStdoutLine(
          buffer,
        );
      }
    })();

    const stderrTask = (async () => {
      for await (
        const chunk
        of child.stderr
      ) {
        if (
          !registerBytes(
            chunk.byteLength,
          )
        ) {
          break;
        }

        stderrChunks.push(chunk);
      }
    })();

    const timeout =
      setTimeout(() => {
        timedOut = true;
        child.kill();
      }, timeoutMs);

    const abort = () => {
      child.kill();
    };

    signal?.addEventListener(
      "abort",
      abort,
      {
        once: true,
      },
    );

    try {
      await Promise.all([
        stdoutTask,
        stderrTask,
        child.exited,
      ]);

    } finally {
      clearTimeout(timeout);

      signal?.removeEventListener(
        "abort",
        abort,
      );
    }

    const exitCode = await child.exited;

    await onEvent?.({
      event: "exit",
      data: {
        exitCode,
      },
    });

    return {
      stdout: stdoutLines.join("\n"),

      stderr: Buffer.concat(stderrChunks).toString("utf8"),

      exitCode: child.exitCode,

      timedOut,
      outputExceeded,
    };
  })();

  const encoder = new TextEncoder();

  return {
    async writeLine(
      line: string,
    ): Promise<void> {
      child.stdin.write(
        encoder.encode(
          `${line}\n`,
        ),
      );

      await child.stdin.flush();
    },

    result,
  };
}