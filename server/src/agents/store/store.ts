import fs from "fs-extra";
import { randomUUID } from "crypto";

import {
  AgentIdentitySchema,
  type AgentIdentity,
} from "../shared/schemas";

import {
  createAgentWorkspace,
  getAgentWorkspacePaths,
} from "../shared/utils/workspace";

import {
  AgentCheckpoint,
  createCheckpointer,
} from "./checkpointer";
import { CreateAgentBody, CreateAgentBodySchema } from "../../routes/schemas";

export type AgentSnapshot = {
  identity: AgentIdentity;
  checkpoint: AgentCheckpoint;
};

export const DEFAULT_AGENT_CHECKPOINT_DATA:
  AgentCheckpoint['data'] = {
  config: {
    model: "",
    prompt: "",
    maxTurns: 3,
    capabilities: [],
    policies: {
      preToolUse: "allow",
    },
  },
  state: {
    messages: [],
    activeRequest: null,
  }
};

export function createDefaultAgentCheckpoint():
  AgentCheckpoint["data"] {
  return DEFAULT_AGENT_CHECKPOINT_DATA
}

export function createAgentStore(
  agentsDir: string,
) {
  async function ensureAgentsDir() {
    await fs.ensureDir(agentsDir);
  }

  async function readIdentity(
    agentId: string,
  ): Promise<AgentIdentity | null> {
    const paths = getAgentWorkspacePaths(
      agentsDir,
      agentId,
    );

    if (!(await fs.pathExists(paths.identity))) {
      return null;
    }

    const rawIdentity = await fs.readJson(
      paths.identity,
    );

    return AgentIdentitySchema.parse(rawIdentity);
  }

  return {
    async create(
      rawInput: CreateAgentBody,
    ): Promise<AgentSnapshot> {
      const input = CreateAgentBodySchema.parse(
        rawInput,
      );

      await ensureAgentsDir();

      const identity = AgentIdentitySchema.parse({
        id: `agent_${randomUUID()}`,
        name: input.name,
      });

      const workspace = await createAgentWorkspace(
        agentsDir,
        identity.id,
      );

      await fs.writeJson(
        workspace.identity,
        identity,
        { spaces: 2 },
      );

      const checkpointer = createCheckpointer(
        workspace.root,
      );

      const checkpoint = await checkpointer.save(
        createDefaultAgentCheckpoint(),
      );

      return {
        identity,
        checkpoint,
      };
    },

    async list(): Promise<AgentIdentity[]> {
      await ensureAgentsDir();

      const entries = await fs.readdir(
        agentsDir,
        {
          withFileTypes: true,
        },
      );

      const identities = await Promise.all(
        entries
          .filter((entry) => entry.isDirectory())
          .map((entry) =>
            readIdentity(entry.name),
          ),
      );

      return identities.filter(
        (identity): identity is AgentIdentity =>
          identity !== null,
      );
    },

    async get(
      agentId: string,
    ): Promise<AgentSnapshot | null> {
      const identity = await readIdentity(agentId);

      if (!identity) {
        return null;
      }

      const workspace = getAgentWorkspacePaths(
        agentsDir,
        agentId,
      );

      const checkpointer = createCheckpointer(
        workspace.root,
      );

      const checkpoint = await checkpointer.load();

      if (!checkpoint) {
        throw new Error(
          `Checkpoint not found for agent: ${agentId}`,
        );
      }

      return {
        identity,
        checkpoint,
      };
    },

    async delete(
      agentId: string,
    ): Promise<boolean> {
      const identity = await readIdentity(agentId);

      if (!identity) {
        return false;
      }

      const workspace = getAgentWorkspacePaths(
        agentsDir,
        agentId,
      );

      await fs.remove(workspace.root);

      return true;
    }
  };
}

export type AgentStore = ReturnType<
  typeof createAgentStore
>;