import type {
    Capability,
} from "../../services/capabilities/types";

import type {
    Workspace,
} from "../../services/workspace/types";

import type {
    SandboxEvent,
} from "@flex-builder/shared/sandbox";

import type {
    CreateSubagentTools,
} from "../../capabilities/subagent/actions/runSubagent";

import {
    createRunTsTool,
} from "./createRunTsTool";

import {
    buildRunTsDescription,
} from "./buildDescription";

import {
    resolveExecutableCapabilities,
    resolvePromptCapabilities,
} from "./resolveRunCapabilties";
import { RunTsRuntime } from "./types";

type CreateSubagentToolsFactoryInput = {
    workspace: Workspace;
    capabilities: Capability[];
    runtime: RunTsRuntime;

    onEvent?: (event: SandboxEvent) =>
        | void
        | Promise<void>;
};

export function createSubagentTools({
    workspace,
    capabilities,
    runtime,
    onEvent,
}: CreateSubagentToolsFactoryInput): CreateSubagentTools {
    return ({
        capabilityIds,
        runId,
    }) => {
        const configs = capabilityIds.map(
            id => ({
                id,
                access: "execute" as const,
            }),
        );

        const executableCapabilities = resolveExecutableCapabilities(
            configs,
            capabilities,
        );

        const promptCapabilities = resolvePromptCapabilities(
            configs,
            capabilities,
        );

        return [
            createRunTsTool({
                runId,
                workspace,
                description: buildRunTsDescription(
                    promptCapabilities,
                ),
                capabilities: executableCapabilities,
                runtime,
                onEvent,
            }),
        ];
    };
}