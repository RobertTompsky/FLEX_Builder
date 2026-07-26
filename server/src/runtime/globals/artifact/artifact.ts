import path from "path";
import fs, { ensureDirSync } from "fs-extra";
import { ARTIFACTS_DIR, SRC_DIR } from "../../../shared/data";
import { registry, historyLog } from "./utils";
import { ArtifactInput, ArtifactOutput, ArtifactOutputSchema, ArtifactSchema } from "./schemas";
import { emitRuntimeEvent } from "../../events";

export function artifact(input: ArtifactInput): ArtifactOutput {
    const config = ArtifactSchema.parse(input);

    const baseDir = ARTIFACTS_DIR;
    ensureDirSync(baseDir);

    let fullPath = path.join(baseDir, config.filePath);
    const timestamp = new Date().toISOString();

    //временно
    if (config.filePath.startsWith("skills/")) {
        fullPath = path.join(SRC_DIR, config.filePath);
    } else {
        fullPath = path.join(ARTIFACTS_DIR, config.filePath);
    }

    const reg = registry(baseDir);
    const log = historyLog(baseDir);

    switch (config.type) {
        case "create": {
            if (fs.existsSync(fullPath)) {
                throw new Error(`Artifact already exists: ${config.filePath}`);
            }

            ensureDirSync(path.dirname(fullPath));
            fs.writeFileSync(fullPath, config.content, "utf8");

            reg.add({
                filePath: config.filePath,
                description: config.description,
                createdAt: timestamp,
                updatedAt: timestamp,
            });

            log.append({
                timestamp,
                type: "create",
                filePath: config.filePath,
                report: config.report,
            });

            emitRuntimeEvent({
                event: "artifact_created",
                data: {
                    filePath: config.filePath,
                    report: config.report,
                    description: config.description,
                },
            });

            return ArtifactOutputSchema.parse({
                type: "create",
                filePath: config.filePath,
            });
        }

        case "read": {
            if (!fs.existsSync(fullPath)) {
                throw new Error(`Artifact not found: ${config.filePath}`);
            }

            const content = fs.readFileSync(fullPath, "utf8");

            log.append({
                timestamp,
                type: "read",
                filePath: config.filePath,
                report: config.report,
            });

            emitRuntimeEvent({
                event: "artifact_read",
                data: {
                    filePath: config.filePath,
                    report: config.report,
                },
            });

            return ArtifactOutputSchema.parse({
                type: "read",
                filePath: config.filePath,
                content,
            });
        }
    }
}