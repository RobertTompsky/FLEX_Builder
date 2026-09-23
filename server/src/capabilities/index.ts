import type {
    Browser,
} from "playwright";

import type {
    Capability,
} from "../services/capabilities/types";

import type {
    Workspace,
} from "../services/workspace/types";

import {
    createArtifactCapability,
} from "./artifact/capability";

import {
    createBrowserCapability,
} from "./browser/capability";

import {
    createCryptoCapability,
} from "./crypto/capability";

import {
    webCapability,
} from "./web/capability";

type CreateCapabilitiesDeps = {
    workspace: Workspace;
    browser: Browser;
    env: {
        coinMarketCapApiKey: string;
    };
};

export function createCapabilities({
    workspace,
    browser,
    env: { coinMarketCapApiKey },
}: CreateCapabilitiesDeps): Capability[] {
    return [
        createArtifactCapability({
            workspace,
        }),

        createBrowserCapability({
            browser,
        }),

        createCryptoCapability({
            coinMarketCapApiKey,
        }),

        webCapability,
    ];
}