import { capability } from "../../services/capabilities";
import { createArtifactAction } from "./actions/createArtifact";
import { readArtifactAction } from "./actions/readArtifact";
import { ArtifactContext } from "./actions/types";

const instructions =
    await Bun.file(
        new URL(
            "./README.md",
            import.meta.url,
        ),
    ).text();

export const artifactDefinition = {
    id: "artifact",
    description: "Provides controlled access to durable files in the agent workspace.",
    instructions,
    actions: {
        create: createArtifactAction,
        read: readArtifactAction,
    },
}

export function createArtifactCapability(
    context: ArtifactContext,
) {
    return capability({
        definition: artifactDefinition,
        createContext: () => context,
    });
}