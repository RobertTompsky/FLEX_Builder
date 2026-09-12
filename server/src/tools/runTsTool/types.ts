import { AgentCapabilityConfig, ArtifactEvent, ExecutionSource, SubagentEvent } from "@flex-builder/shared/capabilities";
import { ResolvedCapability } from "../../services/capabilities/types";
import { Workspace } from "../../services/workspace/types";
import { CodeExecutionEvent } from "../../services/code/events";

export type SandboxEvent =
    | CodeExecutionEvent
    | ArtifactEvent
    | SubagentEvent;

export type CreateRunTsToolInput = {
    runId: string;
    workspace: Workspace;
    description: string;

    resolveCapabilities: (
        source: ExecutionSource,
    ) =>
        | ResolvedCapability[]
        | Promise<ResolvedCapability[]>;

    onEvent?: (
        event: SandboxEvent,
    ) => void | Promise<void>;
};