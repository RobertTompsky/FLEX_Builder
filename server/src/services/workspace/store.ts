import fs from "fs-extra";
import { ensureWorkspace, getWorkspace } from "./workspace";
import path from 'path'

export function createWorkspaceStore(
  agentsDir: string,
) {
  return {
    async create(agentId: string): Promise<void> {
      await fs.ensureDir(agentsDir);

      await ensureWorkspace({ 
        root: path.join(agentsDir, agentId) 
      });
    },

    async delete(agentId: string): Promise<boolean> {
      const workspace = getWorkspace(
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