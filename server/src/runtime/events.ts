export const RUNTIME_EVENT_PREFIX = "__RUNTIME_EVENT__:";

export type RuntimeEvent =
    | {
          event: "artifact_read";
          data: {
              filePath: string;
              report: string;
          };
      }
    | {
          event: "artifact_created";
          data: {
              filePath: string;
              report: string;
              description?: string;
          };
      };

export function emitRuntimeEvent(event: RuntimeEvent) {
  const line =
    `${RUNTIME_EVENT_PREFIX}${JSON.stringify(event)}\n`;

//   console.error("[CHILD EMIT]", line);
  process.stdout.write(line);
}