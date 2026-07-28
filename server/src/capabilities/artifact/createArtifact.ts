import type {
    ArtifactInput,
    ArtifactOutput,
} from "./schemas";

import {
    artifact,
    type ArtifactRuntimeConfig,
} from "./artifact";

export type RuntimeArtifact = (
    input: ArtifactInput,
) => ArtifactOutput;

export function createArtifact(
    runtime: ArtifactRuntimeConfig,
): RuntimeArtifact {
    return (input) =>
        artifact(
            input,
            runtime,
        );
}