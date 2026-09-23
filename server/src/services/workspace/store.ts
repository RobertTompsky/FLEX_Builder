import fs from "fs-extra";
import path from 'path'
import { Workspace } from "./types";

export function createWorkspaceStore(
  workspacesDir: string,
) {
  return {
    agent: {
      async create(
        agentId: string,
      ): Promise<void> {
        await fs.ensureDir(
          path.join(
            workspacesDir,
            agentId,
          ),
        );
      },

      async delete(
        agentId: string,
      ): Promise<boolean> {
        const root = path.join(
          workspacesDir,
          agentId,
        );

        if (!(await fs.pathExists(root))) {
          return false;
        }

        await fs.remove(root);

        return true;
      },
    },

    chat: {
      async create(
        agentId: string,
        chatId: string,
      ): Promise<void> {
        await ensureWorkspace({
          root: path.join(
            workspacesDir,
            agentId,
            chatId,
          ),
        });
      },

      async delete(
        agentId: string,
        chatId: string,
      ): Promise<boolean> {
        const workspace = getWorkspace(
          workspacesDir,
          agentId,
          chatId,
        );

        if (
          !(await fs.pathExists(
            workspace.root,
          ))
        ) {
          return false;
        }

        await fs.remove(
          workspace.root,
        );

        return true;
      },

      get(
        agentId: string,
        chatId: string,
      ): Workspace {
        const workspace = getWorkspace(
          workspacesDir,
          agentId,
          chatId
        )
        
        return workspace
      },
    },
  };
}

export type WorkspaceStore =
  ReturnType<
    typeof createWorkspaceStore
  >;

function getWorkspace(
    workspacesDir: string,
    agentId: string,
    chatId: string,
): Workspace {
    return {
        root: path.join(
            workspacesDir,
            agentId,
            chatId,
        ),
    };
}

async function ensureWorkspace(
  workspace: Workspace,
): Promise<void> {
  await fs.ensureDir(workspace.root);
}