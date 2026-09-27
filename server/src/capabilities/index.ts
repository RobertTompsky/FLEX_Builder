import type {
    Capability,
} from "../services/capabilities/types";

import type {
    Workspace,
} from "../services/workspace/types";

import {
    ARTIFACT_CAPABILITY_DEFINITION,
    createArtifactCapability,
} from "./artifact/capability";

import {
    BROWSER_CAPABILITY_DEFINITION,
    browserCapabilitiy
} from "./browser/capability";

import {
    CRYPTO_CAPABILITY_DEFINITION,
    cryptoCapability,
} from "./crypto/capability";

import {
    WEB_CAPABILITY_DEFINITION,
    webCapability,
} from "./web/capability";
import { createSubagentCapability, SUBAGENT_CAPABILITY_DEFINITION } from "./subagent/capability";
import { CreateSubagentTools } from "./subagent/actions/runSubagent";

type CapabilityFactoryContext = {
    workspace: Workspace;
    createSubagentTools?: CreateSubagentTools;
};

type CapabilityEntry = {
    definition: Pick<Capability, "id" | 'description'>;

    create: (
        context: CapabilityFactoryContext,
    ) => Capability | null;
};

const CAPABILITY_REGISTRY = {
    artifact: {
        definition: ARTIFACT_CAPABILITY_DEFINITION,

        create: ({ workspace }) =>
            createArtifactCapability({
                workspace,
            }),
    },

    browser: {
        definition: BROWSER_CAPABILITY_DEFINITION,

        create: () => browserCapabilitiy,
    },

    crypto: {
        definition: CRYPTO_CAPABILITY_DEFINITION,

        create: () => cryptoCapability,
    },

    web: {
        definition: WEB_CAPABILITY_DEFINITION,
        create: () => webCapability,
    },

    subagent: {
        definition: SUBAGENT_CAPABILITY_DEFINITION,

        create: ({ createSubagentTools }) =>
            createSubagentTools
                ? createSubagentCapability({
                    createTools:
                        createSubagentTools,
                })
                : null,
    },
} satisfies Record<
    string,
    CapabilityEntry
>;

export const CAPABILITY_DEFINITIONS = Object
    .values(CAPABILITY_REGISTRY)
    .map(({ definition }) => definition);

export function createCapabilities(
    context: CapabilityFactoryContext,
): Capability[] {
    return Object
        .values(CAPABILITY_REGISTRY)
        .map(({ create }) => create(context))
        .filter((capability): capability is Capability => capability !== null);
}