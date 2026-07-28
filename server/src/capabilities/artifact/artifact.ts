import path from "path";
import fs from "fs-extra";

import {
    ArtifactOutputSchema,
    ArtifactSchema,
    type ArtifactInput,
    type ArtifactOutput,
} from "./schemas";

import {
    historyLog,
    registry,
} from "./utils";
import { emitRuntimeEvent } from "../../runtime/events";

export type ArtifactRuntimeConfig = {
    baseDir: string;
};

export function artifact(
    input: ArtifactInput,
    runtime: ArtifactRuntimeConfig,
): ArtifactOutput {
    const config =
        ArtifactSchema.parse(input);

    const baseDir =
        path.resolve(runtime.baseDir);

    fs.ensureDirSync(baseDir);

    const fullPath = resolveArtifactPath(
        baseDir,
        config.filePath,
    );

    const timestamp =
        new Date().toISOString();

    const reg =
        registry(baseDir);

    const log =
        historyLog(baseDir);

    switch (config.type) {
        case "create": {
            if (fs.existsSync(fullPath)) {
                throw new Error(
                    `Artifact already exists: ${config.filePath}`,
                );
            }

            fs.ensureDirSync(
                path.dirname(fullPath),
            );

            fs.writeFileSync(
                fullPath,
                config.content,
                "utf8",
            );

            reg.add({
                filePath:
                    config.filePath,

                description:
                    config.description,

                createdAt:
                    timestamp,

                updatedAt:
                    timestamp,
            });

            log.append({
                timestamp,
                type: "create",
                filePath:
                    config.filePath,
                report:
                    config.report,
            });

            emitRuntimeEvent({
                event:
                    "artifact_created",

                data: {
                    filePath:
                        config.filePath,

                    report:
                        config.report,

                    description:
                        config.description,
                },
            });

            return ArtifactOutputSchema.parse({
                type: "create",
                filePath:
                    config.filePath,
            });
        }

        case "read": {
            if (!fs.existsSync(fullPath)) {
                throw new Error(
                    `Artifact not found: ${config.filePath}`,
                );
            }

            const stats =
                fs.statSync(fullPath);

            if (!stats.isFile()) {
                throw new Error(
                    `Artifact is not a file: ${config.filePath}`,
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
                    config.filePath,
                report:
                    config.report,
            });

            emitRuntimeEvent({
                event:
                    "artifact_read",

                data: {
                    filePath:
                        config.filePath,

                    report:
                        config.report,
                },
            });

            return ArtifactOutputSchema.parse({
                type: "read",
                filePath:
                    config.filePath,
                content,
            });
        }
    }
}

function resolveArtifactPath(
    baseDir: string,
    filePath: string,
): string {
    const resolvedPath =
        path.resolve(
            baseDir,
            filePath,
        );

    const relativePath =
        path.relative(
            baseDir,
            resolvedPath,
        );

    if (
        relativePath === "" ||
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(
            `Artifact path is outside the workspace: ${filePath}`,
        );
    }

    return resolvedPath;
}