import { defineCapability } from "../../runtime/execute/defineCapability";
import { createArtifactAction } from "./actions/createArtifact";
import { readArtifactAction } from "./actions/readArtifact";

export default defineCapability({
    id: "artifact",
    description:
        "Provides controlled access to durable files in the agent workspace.",
    instructions:
        await Bun.file(
            new URL(
                "./README.md",
                import.meta.url,
            ),
        ).text(),
    actions: {
        create: createArtifactAction,
        read: readArtifactAction,
    },
});