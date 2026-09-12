import { ArtifactEvent, CapabilityContext, ExecutionSource } from "@flex-builder/shared/capabilities";
import { Workspace } from "../../../services/workspace/types";

import { SandboxEvent } from "../../../tools/runTsTool/types";

export type ArtifactContext =
    CapabilityContext & {
        workspace: Workspace;
        source: ExecutionSource;
        onEvent?: (
            event: SandboxEvent,
        ) =>
            | void
            | Promise<void>;
    };

export type SubagentContext =
    CapabilityContext;