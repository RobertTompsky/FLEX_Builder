import { z } from "zod";
import { SafeFilePathSchema } from "../schemas";
import { RuntimeContext } from "../../../runtime/types";
import { getArtifactsDir } from "../runtime";
import { resolveArtifactPath } from "../utils/resolveArtifactPath";
import { artifactRegistry } from "../utils/registry";
import { artifactHistoryLog } from "../utils/history";
import path from "path";
import fs from "fs-extra";
import { emitRuntimeEvent } from "../../../runtime/events";
import { action } from "../../../runtime/execute";

export const CreateArtifactInputSchema =
    z.object({
        filePath:
            SafeFilePathSchema
                .describe(
                    "Path to the file inside the artifacts directory, relative to its root. The path must include the file extension.",
                ),

        content:
            z.string()
                .describe(
                    "Content to write to the created file.",
                ),

        description:
            z.string()
                // .optional()
                .describe(
                    "Short description of the created artifact. Used in the artifact registry.",
                ),

        report:
            z.string()
                .describe(
                    "Brief report describing the file creation action and its purpose.",
                ),
    });

export const CreateArtifactOutputSchema =
    z.object({
        filePath:
            SafeFilePathSchema
                .describe(
                    "Path to the file inside the artifacts directory, relative to its root. The path must include the file extension.",
                ),
    });

export function createArtifact(
    input: z.infer<typeof CreateArtifactInputSchema>,
    context: RuntimeContext,
): z.infer<typeof CreateArtifactOutputSchema> {
    const artifactsDir = getArtifactsDir(context,);

    const fullPath = resolveArtifactPath(artifactsDir, input.filePath,);

    const timestamp = new Date().toISOString();

    const reg = artifactRegistry(artifactsDir);

    const log = artifactHistoryLog(artifactsDir);

    if (fs.existsSync(fullPath)) {
        throw new Error(
            `Artifact already exists: ${input.filePath}`,
        );
    }

    fs.ensureDirSync(
        path.dirname(fullPath),
    );

    fs.writeFileSync(
        fullPath,
        input.content,
        "utf8",
    );

    reg.add({
        filePath: input.filePath,
        description: input.description,
        createdAt: timestamp,
        updatedAt: timestamp,
    });

    log.append({
        timestamp,
        type: "create",
        filePath: input.filePath,
        report: input.report,
    });

    emitRuntimeEvent({
        event: "artifact_created",
        data: {
            filePath: input.filePath,
            report: input.report,
            description: input.description,
        },
    });

    return CreateArtifactOutputSchema.parse({
        type: "create",
        filePath: input.filePath,
    });
}

export const createArtifactAction = action({
    description: "Creates a file in the artifacts directory.",
    inputSchema: CreateArtifactInputSchema,
    outputSchema: CreateArtifactOutputSchema,
    handler: createArtifact
})

