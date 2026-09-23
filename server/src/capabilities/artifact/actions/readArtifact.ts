import { z } from "zod";
import { SafeFilePathSchema } from "../schemas";
import { getArtifactsDir } from "../utils/getArtifactsDIr";
import { resolveArtifactPath } from "../utils/resolveArtifactPath";
import { artifactHistoryLog } from "../utils/history";
import fs from "fs-extra";
import { ArtifactContext } from "./types";
import { action } from "../../../services/capabilities";

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




export function createReadArtifactAction({
    workspace,
}: ArtifactContext) {
    return action({
        description:
            "Reads a file from the artifacts directory.",

        inputSchema:
            ReadArtifactInputSchema,

        outputSchema:
            ReadArtifactOutputSchema,

        async execute({
            args,
            options,
        }) {
            const artifactsDir =
                getArtifactsDir(
                    workspace.root,
                );

            const fullPath =
                resolveArtifactPath(
                    artifactsDir,
                    args.filePath,
                );

            const timestamp =
                new Date()
                    .toISOString();

            const log =
                artifactHistoryLog(
                    artifactsDir,
                );

            if (
                !fs.existsSync(
                    fullPath,
                )
            ) {
                throw new Error(
                    `Artifact not found: ${args.filePath}`,
                );
            }

            const stats =
                fs.statSync(
                    fullPath,
                );

            if (
                !stats.isFile()
            ) {
                throw new Error(
                    `Artifact is not a file: ${args.filePath}`,
                );
            }

            const content =
                fs.readFileSync(
                    fullPath,
                    "utf8",
                );

            log.append({
                timestamp,
                type: "read",
                filePath:
                    args.filePath,
                report:
                    args.report,
            });

            await options.emit?.({
                event:
                    "artifact_read",

                data: {
                    filePath:
                        args.filePath,

                    report:
                        args.report,
                },
            });

            return {
                filePath:
                    args.filePath,

                content,
            };
        },
    });
}