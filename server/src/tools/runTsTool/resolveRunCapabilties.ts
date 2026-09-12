import {
    AgentCapabilityConfig,
    ExecutionSource,
} from "@flex-builder/shared/capabilities";

import type {
    Workspace,
} from "../../services/workspace/types";

import type {
    ResolvedCapability,
} from "../../services/capabilities/types";

import {
    artifactDefinition,
    createArtifactCapability,
} from "../../capabilities/artifact/capability";

import {
    cryptoCapability,
    cryptoDefinition,
} from "../../capabilities/crypto/capability";

import {
    createSubagentCapability,
    subagentPromptDefinition,
} from "../../capabilities/subagent/capability";

import type {
    CreateSubagentTools,
} from "../../capabilities/subagent/actions/runSubagent";

import {
    webCapability,
    webDefinition,
} from "../../capabilities/web/capability";

import {
    browserCapability,
    browserDefinition,
} from "../../capabilities/browser/capability1";
import { CapabilityPromptInput } from "../../services/capabilities/prompt/capabilityPrompt";
import { SandboxEvent } from "./types";


type SandboxEventHandler = (
    event: SandboxEvent,
) => void | Promise<void>;

type ResolveRunCapabilitiesInput = {
    configs:
    AgentCapabilityConfig[];

    workspace:
    Workspace;

    source:
    ExecutionSource;

    createSubagentTools:
    CreateSubagentTools;

    onEvent?:
    SandboxEventHandler;
};

export function resolvePromptCapabilities(
    configs: AgentCapabilityConfig[],
): CapabilityPromptInput[] {
    return configs.map(
        ({
            id,
            access,
        }) => {
            switch (id) {
                case "artifact":
                    return {
                        ...artifactDefinition,
                        access,
                    };

                case "subagent":
                    return {
                        ...subagentPromptDefinition,
                        access,
                    };

                case "web":
                    return {
                        ...webDefinition,
                        access,
                    };

                case "crypto":
                    return {
                        ...cryptoDefinition,
                        access,
                    };

                case "browser":
                    return {
                        ...browserDefinition,
                        access,
                    };

                default:
                    throw new Error(
                        `Unknown capability "${id}"`,
                    );
            }
        },
    );
}

export function resolveRunCapabilities({
    configs,
    workspace,
    source,
    createSubagentTools,
    onEvent,
}: ResolveRunCapabilitiesInput):
    ResolvedCapability[] {
    return configs.map(
        ({
            id,
            access,
        }) => {
            switch (id) {
                case "artifact":
                    return {
                        access,

                        plugin:
                            createArtifactCapability({
                                workspace,
                                source,
                                onEvent,
                            }),
                    };

                case "subagent":
                    return {
                        access,

                        plugin:
                            createSubagentCapability({
                                context: {
                                    workspace,
                                    source,
                                    onEvent,
                                },

                                createTools:
                                    createSubagentTools,
                            }),
                    };

                case "web":
                    return {
                        access,
                        plugin:
                            webCapability,
                    };

                case "crypto":
                    return {
                        access,
                        plugin:
                            cryptoCapability,
                    };

                case "browser":
                    return {
                        access,
                        plugin:
                            browserCapability,
                    };

                default:
                    throw new Error(
                        `Unknown capability "${id}"`,
                    );
            }
        },
    );
}