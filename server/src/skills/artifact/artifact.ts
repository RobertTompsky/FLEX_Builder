import path from "path";
import fs, { ensureDirSync } from 'fs-extra'
import { ARTIFACTS_DIR } from "../../data";
import { registry, historyLog } from "./utils";
import { ReadSchema, WriteSchema } from "./schemas";
import type z from "zod";

export type WriteArtifactInput = z.infer<typeof WriteSchema>;
export type ReadArtifactInput = z.infer<typeof ReadSchema>;

export const artifact = {
    create(input: WriteArtifactInput) {
        const config = WriteSchema.parse(input);

        const baseDir = ARTIFACTS_DIR;
        ensureDirSync(baseDir);
        const fullPath = path.join(baseDir, config.filePath);
        const timestamp = new Date().toISOString();

        const reg = registry(baseDir);
        const log = historyLog(baseDir);

        if (fs.existsSync(fullPath)) {
            throw new Error(`Artifact already exists: ${config.filePath}`);
        }

        ensureDirSync(path.dirname(fullPath));
        fs.writeFileSync(fullPath, config.content, "utf8");

        const items = reg.list();

        items.push({
            filePath: config.filePath,
            description: config.description,
            updatedAt: timestamp,
        });

        reg.save(items);

        log.append({
            timestamp,
            type: "create",
            filePath: config.filePath,
            report: config.report,
        });

        return {
            type: "create" as const,
            filePath: config.filePath,
        };
    },

    update(input: WriteArtifactInput) {
        const config = WriteSchema.parse(input);

        const baseDir = ARTIFACTS_DIR;
        ensureDirSync(baseDir);
        const fullPath = path.join(baseDir, config.filePath);
        const timestamp = new Date().toISOString();

        const reg = registry(baseDir);
        const log = historyLog(baseDir);

        if (!fs.existsSync(fullPath)) {
            throw new Error(`Artifact not found: ${config.filePath}`);
        }

        ensureDirSync(path.dirname(fullPath))
        fs.writeFileSync(fullPath, config.content, "utf8");

        const items = reg.list();
        const item = items.find((x) => x.filePath === config.filePath);

        if (!item) {
            throw new Error(`Artifact missing in registry: ${config.filePath}`);
        }

        if (config.description) {
            item.description = config.description;
        }

        item.updatedAt = timestamp;

        reg.save(items);

        log.append({
            timestamp,
            type: "update",
            filePath: config.filePath,
            report: config.report,
        });

        return {
            type: "update" as const,
            filePath: config.filePath,
        };
    },

    read(input: ReadArtifactInput) {
        const config = ReadSchema.parse(input);

        const baseDir = ARTIFACTS_DIR;
        ensureDirSync(baseDir);
        const fullPath = path.join(baseDir, config.filePath);
        const timestamp = new Date().toISOString();

        const log = historyLog(baseDir);

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

        return {
            type: "read" as const,
            filePath: config.filePath,
            content,
        };
    },
};