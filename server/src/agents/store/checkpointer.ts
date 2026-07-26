import type {
  ResponseInputItem,
} from "openai/resources/responses/responses.js";
import { z } from 'zod'
import fs from "fs-extra";
import path from "path";
import { HookPolicySelectionSchema } from "../harness/hooks/schemas";

export const AgentCheckpointConfigSchema =
  z.object({
    model: z.string(),
    prompt: z.string(),

    maxTurns: z
      .number()
      .int()
      .positive(),

    globals: z.array(
      z.string(),
    ),

    skills: z.array(
      z.string(),
    ),

    policies:
      HookPolicySelectionSchema,
  });

export type AgentCheckpointConfig =
  z.infer<
    typeof AgentCheckpointConfigSchema
  >;

export type ActiveRequest = {
    id: string;
    turnsUsed: number;
};

export type AgentState = {
    messages: ResponseInputItem[];
    activeRequest: ActiveRequest | null;
};

export type AgentCheckpoint = {
  updatedAt: number;

  data: {
    config: AgentCheckpointConfig;
    state: AgentState;
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