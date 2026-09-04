import fs from "fs-extra";

import {
  createAgentWorkspace,
  getAgentWorkspacePaths,
} from "../shared";

export function createWorkspaceStore(
  agentsDir: string,
) {
  return {
    async create(agentId: string): Promise<void> {
      await fs.ensureDir(agentsDir);

      await createAgentWorkspace(
        agentsDir,
        agentId,
      );
    },

    async delete(agentId: string): Promise<boolean> {
      const workspace = getAgentWorkspacePaths(
        agentsDir,
        agentId,
      );

      if (!(await fs.pathExists(workspace.root))) {
        return false;
      }

      await fs.remove(workspace.root);

      return true;
    },
  };
}

export type WorkspaceStore = ReturnType<
  typeof createWorkspaceStore
>;