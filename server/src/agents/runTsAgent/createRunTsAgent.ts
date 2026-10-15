import type {
    ResponseInputItem,
} from "openai/resources/responses/responses.js";

import type {
    AgentEvent,
} from "@flex-builder/shared/agent";

import type {
    SandboxEvent,
} from "@flex-builder/shared/sandbox";

import {
    MODELS,
} from "@flex-builder/shared/data";

import {
    createRunTsTool,
} from "../../tools/runTsTool/createRunTsTool";

import type {
    RunTsRuntime,
} from "../../tools/runTsTool/types";

import type {
    EntryType,
} from "@typesafe-ai/sdk";
import { agent } from "../../services/agent/agent";
import { AgentHooks } from "../../services/agent/hooks/types";
import { Capability } from "../../services/capabilities/types";
import { decision } from "../../services/decision";
import { Workspace } from "../../services/workspace/types";
import { AgentResult } from "../../services/agent/types";

type ModelName = keyof typeof MODELS;

type RunTsAgentEvent =
    | AgentEvent
    | SandboxEvent;

type RunTsAgentEventHandler = (
    event: RunTsAgentEvent,
) => void | Promise<void>;

type CreateRunTsAgentInput = {
    runtime: RunTsRuntime;
};

type RunTsAgentConfig = {
    runId: string;
    model: ModelName;
    messages: ResponseInputItem[];
    workspace: Workspace;
    capabilities: Capability[];
    selector?: "jev";
    hooks?: AgentHooks;
    opts?: {
        maxTurns?: number;
        signal?: AbortSignal;
        maxExecuteConcurrency?: number;
    };
};

export function createRunTsAgent({
    runtime,
}: CreateRunTsAgentInput) {
    return async function runTsAgent(
        config: RunTsAgentConfig,
        onEvent?: RunTsAgentEventHandler,
    ): Promise<AgentResult> {
        const {
            runId,
            model,
            messages,
            workspace,
            capabilities,
            selector,
            hooks,
            opts,
        } = config;

        const selectedCapabilities = selector === "jev"
            ? await selectCapabilities({
                messages,
                capabilities,
                onEvent,
            })
            : capabilities;

        const description = buildRunTsDescription(selectedCapabilities);

        const runTsTool = createRunTsTool({
            runId,
            workspace,
            description,
            capabilities: selectedCapabilities,
            maxExecuteConcurrency: opts?.maxExecuteConcurrency ?? 5,
            runtime,
            onEvent: async event => await onEvent?.(event),
        });

        return agent(
            {
                model,
                messages,
                tools: [
                    runTsTool,
                ],
                hooks,
                opts: {
                    maxTurns: opts?.maxTurns,
                    signal: opts?.signal,
                },
            },

            async event => {
                await onEvent?.(event);
            },
        );
    };
}

async function selectCapabilities({
    messages,
    capabilities,
    onEvent,
}: {
    messages: ResponseInputItem[];
    capabilities: Capability[];
    onEvent?: RunTsAgentEventHandler;
}): Promise<Capability[]> {
    if (capabilities.length === 0) {
        return [];
    }

    const scores = await decision.score({
        state: toDecisionState(messages),
        questions: Object.fromEntries(
            capabilities.map(
                capability => [
                    capability.id,
                    {
                        question: [
                            "How useful is this capability for completing the user's request?",
                            "",
                            `Capability: ${capability.id}`,
                            "",
                            capability.description,
                        ].join("\n"),
                        criteria: [
                            "Not needed",
                            "Possibly useful",
                            "Useful",
                            "Clearly needed",
                        ],
                    },
                ],
            ),
        ),
        emit: async event => {
            await onEvent?.(event);
        },
    });

    return capabilities.filter(
        capability => {
            const result = scores[capability.id];

            return (
                result !== undefined
                && result.score >= 2
            );
        },
    );
}

function buildRunTsDescription(
    capabilities: Capability[],
): string {
    const capabilitiesDescription =
        capabilities
            .map(
                capability => [
                    capability.id,
                    capability.description,
                ].join(": "),
            )
            .join("\n");

    return [
        "Execute TypeScript code in a sandboxed Bun process.",

        capabilitiesDescription
            ? [
                "Available capabilities:",
                capabilitiesDescription,
            ].join("\n")
            : "No external capabilities are available.",
    ].join("\n\n");
}


function toDecisionState(
    value: unknown,
): EntryType {
    return JSON.parse(
        JSON.stringify(
            value,
        ),
    ) as EntryType;
}