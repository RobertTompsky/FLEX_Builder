import path from "node:path";
import fs from "fs-extra";
import { Workspace } from "./types";

export function getWorkspace(
    rootDir: string,
    id: string,
): Workspace {
    const safeId = path.basename(id);

    if (safeId !== id) {
        throw new Error(
            "Invalid workspace id",
        );
    }

    return {
        root: path.join(rootDir, safeId),
    };
}

export async function ensureWorkspace(
    workspace: Workspace,
): Promise<void> {
    await fs.ensureDir(workspace.root);
}