import type {
  ResponseInputItem,
} from "openai/resources/responses/responses.js";

import fs from "fs-extra";
import path from "path";
import { AgentCheckpointConfig } from "../schemas";

export type AgentCheckpoint = {
  updatedAt: number;

  data: {
    config: AgentCheckpointConfig;
    messages: ResponseInputItem[];
  };
};

export type Checkpointer = {
  save(data: AgentCheckpoint["data"]): Promise<AgentCheckpoint>;
  load(): Promise<AgentCheckpoint | null>;
  clear(): Promise<void>;
};

export function createCheckpointer(
  agentDir: string,
): Checkpointer {
  const checkpointPath = path.join(
    agentDir,
    "checkpoint.json",
  );

  async function ensureAgentDir() {
    await fs.ensureDir(agentDir);
  }

  async function loadCheckpoint(): Promise<AgentCheckpoint | null> {
    if (!(await fs.pathExists(checkpointPath))) {
      return null;
    }

    try {
      const checkpoint = await fs.readJson(checkpointPath) as AgentCheckpoint;

      return checkpoint;
    } catch {
      return null;
    }
  }

  return {
    async save(data) {
      await ensureAgentDir();

      const checkpoint: AgentCheckpoint = {
        updatedAt: Date.now(),
        data,
      };

      await fs.writeJson(
        checkpointPath,
        checkpoint,
        {
          spaces: 2,
        },
      );

      return checkpoint;
    },

    load: loadCheckpoint,

    async clear() {
      if (await fs.pathExists(checkpointPath)) {
        await fs.remove(checkpointPath);
      }
    },
  };
}