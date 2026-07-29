import path from "node:path";
import fs from "fs-extra";

import type {
    RuntimeContext,
} from "../../runtime/types";

export function getArtifactsDir(
    context: RuntimeContext,
): string {
    const artifactsDir =
        path.join(
            context.workspaceRoot,
            "artifacts",
        );

    fs.ensureDirSync(
        artifactsDir,
    );

    return artifactsDir;
}