import type {
    ArtifactEvent,
} from "./artifact/events";

import type {
    SubagentEvent,
} from "./subagent/events";

export type CapabilityEvent =
    | ArtifactEvent
    | SubagentEvent;