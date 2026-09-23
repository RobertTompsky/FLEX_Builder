import {
    capability,
} from "../../services/capabilities";

import {
    createArtifactAction,
} from "./actions/createArtifact";

import {
    createReadArtifactAction,
} from "./actions/readArtifact";
import { ArtifactContext } from "./actions/types";

const instructions =
    await Bun.file(
        new URL(
            "./README.md",
            import.meta.url,
        ),
    ).text();

export function createArtifactCapability(
    context: ArtifactContext,
) {
    return capability({
        id: "artifact",

        description:
            "Provides controlled access to durable files in the agent workspace.",

        instructions,

        actions: {
            create:
                createArtifactAction(context),

            read:
                createReadArtifactAction(context),
        },
    });
}