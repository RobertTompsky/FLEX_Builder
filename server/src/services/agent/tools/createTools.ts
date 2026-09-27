import type {
    Browser,
} from "playwright";

import type {
    AgentCapabilityConfig,
} from "@flex-builder/shared/capabilities";

import type {
    SandboxEvent,
} from "@flex-builder/shared/sandbox";

import type {
    Workspace,
} from "../../workspace/types";

import type {
    ToolRegistry,
} from "../../tools/types";

import type {
    RunTsRuntime,
} from "../../../tools/runTsTool/types";

import {
    createCapabilities,
} from "../../../capabilities";

import {
    createSubagentCapability,
} from "../../../capabilities/subagent/capability";

import {
    createRunTsTool,
} from "../../../tools/runTsTool/createRunTsTool";

import {
    buildRunTsDescription,
} from "../../../tools/runTsTool/buildDescription";

import {
    resolveExecutableCapabilities,
    resolvePromptCapabilities,
} from "../../../tools/runTsTool/resolveRunCapabilties";

type CreateAgentToolsInput = {
    runId: string;
    workspace: Workspace;
    capabilities: AgentCapabilityConfig[];
    runtime: RunTsRuntime;
    onEvent?: (event: SandboxEvent) =>
        | void
        | Promise<void>;
    allowSubagents?: boolean;
};

export function createAgentTools({
    runId,
    workspace,
    capabilities: configs,
    runtime,
    onEvent,
    allowSubagents = true,
}: CreateAgentToolsInput): ToolRegistry {
    const baseCapabilities = createCapabilities({ workspace });

    const availableCapabilities = allowSubagents
        ? [
            ...baseCapabilities,

            createSubagentCapability({
                createTools: ({
                    capabilityIds,
                    runId,
                }) =>
                    createAgentTools({
                        runId,
                        workspace,
                        capabilities:
                            capabilityIds.map(
                                id => ({
                                    id,
                                    access:
                                        "execute" as const,
                                }),
                            ),

                        runtime,
                        onEvent,
                        allowSubagents: false,
                    }),
            }),
        ]
        : baseCapabilities;

    const executableCapabilities = resolveExecutableCapabilities(
        configs,
        availableCapabilities,
    );

    const promptCapabilities = resolvePromptCapabilities(
        configs,
        availableCapabilities,
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
}