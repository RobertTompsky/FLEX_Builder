import type {
  ResponseInputItem,
} from "openai/resources/responses/responses.js";
import fs from "fs-extra";
import path from "path";
import type {
  AgentConfig
} from "@flex-builder/shared/agent";

export type ServerCheckpoint = {
  updatedAt: number;
  data: {
    config: AgentConfig;
    messages: ResponseInputItem[];
  };
};

export type Checkpointer = {
  save(data: ServerCheckpoint["data"]): Promise<ServerCheckpoint>;
  load(): Promise<ServerCheckpoint | null>;
  clear(): Promise<void>;
};

export function createCheckpointer(
  agentDir: string,
): Checkpointer {
  const checkpointPath = path.join(
    agentDir,
    "checkpoint.json",
  );

  async function loadCheckpoint(): Promise<ServerCheckpoint | null> {
    if (!(await fs.pathExists(checkpointPath))) {
      return null;
    }

    try {
      return await fs.readJson(checkpointPath) as ServerCheckpoint;
    } catch {
      return null;
    }
  }

  return {
    async save(data) {
      await fs.ensureDir(agentDir);

      const checkpoint: ServerCheckpoint = {
        updatedAt: Date.now(),
        data,
      };

      await fs.writeJson(
        checkpointPath,
        checkpoint,
        { spaces: 2 },
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