import { ArtifactEvent } from "./artifact";
import { SubagentEvent } from "./subagent";

export type CapabilityEvent =
    | ArtifactEvent
    | SubagentEvent;