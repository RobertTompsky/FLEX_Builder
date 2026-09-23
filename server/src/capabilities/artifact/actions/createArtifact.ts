import { z } from "zod";
import { SafeFilePathSchema } from "../schemas";
import { getArtifactsDir } from "../utils/getArtifactsDIr";
import { resolveArtifactPath } from "../utils/resolveArtifactPath";
import { artifactRegistry } from "../utils/registry";
import { artifactHistoryLog } from "../utils/history";
import path from "path";
import fs from "fs-extra";
import { action } from "../../../services/capabilities";
import { ArtifactContext } from "./types";

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

export function createArtifactAction({
    workspace,
}: ArtifactContext) {
    return action({
        description:
            "Creates a file in the artifacts directory.",

        inputSchema:
            CreateArtifactInputSchema,

        outputSchema:
            CreateArtifactOutputSchema,

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

            const reg =
                artifactRegistry(
                    artifactsDir,
                );

            const log =
                artifactHistoryLog(
                    artifactsDir,
                );

            if (
                fs.existsSync(
                    fullPath,
                )
            ) {
                throw new Error(
                    `Artifact already exists: ${args.filePath}`,
                );
            }

            fs.ensureDirSync(
                path.dirname(
                    fullPath,
                ),
            );

            fs.writeFileSync(
                fullPath,
                args.content,
                "utf8",
            );

            reg.add({
                filePath:
                    args.filePath,

                description:
                    args.description,

                createdAt:
                    timestamp,

                updatedAt:
                    timestamp,
            });

            log.append({
                timestamp,
                type:
                    "create",

                filePath:
                    args.filePath,

                report:
                    args.report,
            });

            await options.emit?.({
                event:
                    "artifact_created",

                data: {
                    filePath:
                        args.filePath,

                    report:
                        args.report,

                    description:
                        args.description,
                },
            });

            return {
                filePath:
                    args.filePath,
            };
        },
    });
}