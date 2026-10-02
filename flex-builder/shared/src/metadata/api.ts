import type {
    CapabilityAccess,
} from "../capabilities/capabilities.types";

import type {
    HookPoliciesInfo,
} from "../hooks/hooks.types";

import {
    MODELS,
} from "../data";

export type MetadataResponse = {
    uploads: string[];
    models: typeof MODELS;
    capabilities: {
        items: Array<{
            id: string;
            description: string;
        }>;
        accessOptions: readonly CapabilityAccess[];
    };
    policies: HookPoliciesInfo;
};