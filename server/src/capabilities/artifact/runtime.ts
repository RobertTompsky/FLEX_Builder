import path from "node:path";
import fs from "fs-extra";

export function getArtifactsDir(
    workspaceRoot: string
): string {
    const artifactsDir = path.join(workspaceRoot, "artifacts");

    fs.ensureDirSync(artifactsDir);

    return artifactsDir;
}