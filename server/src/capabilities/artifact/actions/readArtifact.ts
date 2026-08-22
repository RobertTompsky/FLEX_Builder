import { z } from "zod";
import { SafeFilePathSchema } from "../schemas";
import { RuntimeContext } from "../../../runtime/types";
import { getArtifactsDir } from "../runtime";
import { resolveArtifactPath } from "../utils/resolveArtifactPath";
import { artifactHistoryLog } from "../utils/history";
import fs from "fs-extra";
import { createRuntimeEmitter } from "../../../runtime/events";
import { action } from "../../../runtime/execute";
import { ArtifactEvent } from "@flex-builder/shared/capabilities";

export const ReadArtifactInputSchema =
    z.object({
        filePath:
            SafeFilePathSchema
                .describe(
                    "Path to the read file inside the artifacts directory, relative to its root. The path must include the file extension.",
                ),

        report:
            z.string()
                .describe(
                    "Brief report describing the file reading action and its purpose.",
                ),
    });

export const ReadArtifactOutputSchema =
    z.object({
        filePath:
            SafeFilePathSchema
                .describe(
                    "Path to the read file inside the artifacts directory, relative to its root. The path must include the file extension.",
                ),

        content:
            z.string()
                .describe(
                    "Content read from the file.",
                ),
    });

export function readArtifact(
    input: z.infer<typeof ReadArtifactInputSchema>,
    context: RuntimeContext,
): z.infer<typeof ReadArtifactOutputSchema> {
    const artifactsDir = getArtifactsDir(context,);

    const fullPath = resolveArtifactPath(artifactsDir, input.filePath,);

    const timestamp = new Date().toISOString();

    const log = artifactHistoryLog(artifactsDir);

    if (!fs.existsSync(fullPath)) {
        throw new Error(
            `Artifact not found: ${input.filePath}`,
        );
    }

    const stats = fs.statSync(fullPath);

    if (!stats.isFile()) {
        throw new Error(
            `Artifact is not a file: ${input.filePath}`,
        );
    }

    const content = fs.readFileSync(fullPath, "utf8",);

    log.append({
        timestamp,
        type: "read",
        filePath: input.filePath,
        report: input.report,
    });

    const emitArtifactEvent = createRuntimeEmitter<ArtifactEvent>()

    emitArtifactEvent({
        event: "artifact_read",
        data: {
            runId: context.runId,
            toolCallId: context.toolCallId,
            filePath: input.filePath,
            report: input.report,
        },
    });

    return ReadArtifactOutputSchema.parse({
        type: "read",
        filePath: input.filePath,
        content,
    });
}

export const readArtifactAction = action({
    description: "Reads a file from the artifacts directory.",
    inputSchema: ReadArtifactInputSchema,
    outputSchema: ReadArtifactOutputSchema,
    handler: readArtifact
})