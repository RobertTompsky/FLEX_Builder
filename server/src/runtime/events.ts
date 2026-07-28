import type { ArtifactEvent } from "../capabilities/artifact/events";
import type { SubagentEvent } from "../capabilities/subagent/events";

export const RUNTIME_EVENT_PREFIX = "__RUNTIME_EVENT__:";

export type RuntimeEvent =
  | ArtifactEvent
  | SubagentEvent;

export function emitRuntimeEvent(event: RuntimeEvent): void {
  process.stdout.write(
    `${RUNTIME_EVENT_PREFIX}${JSON.stringify(event)}\n`,
  );
}