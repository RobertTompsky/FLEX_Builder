import fs from "fs-extra";
import { randomUUID } from "crypto";

import {
  AgentIdentitySchema,
  CreateAgentBodySchema,
  DEFAULT_AGENT_CHECKPOINT_CONFIG,
  type AgentIdentity,
  type AgentSnapshot,
  type CreateAgentBody,
} from "./schemas";

import {
  createAgentWorkspace,
  getAgentWorkspacePaths,
} from "./utils/workspace";

import {
  AgentCheckpoint,
  createCheckpointer,
} from "./utils/checkpointer";

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

  async function saveCheckpoint(
    agentId: string,
    data: AgentCheckpoint["data"],
  ): Promise<AgentCheckpoint | null> {
    const identity = await readIdentity(agentId);

    if (!identity) {
      return null;
    }

    const workspace = getAgentWorkspacePaths(
      agentsDir,
      agentId,
    );

    return createCheckpointer(
      workspace.root,
    ).save(data);
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

      const checkpoint = await checkpointer.save({
        config: {
          ...DEFAULT_AGENT_CHECKPOINT_CONFIG,
          globals: [
            ...DEFAULT_AGENT_CHECKPOINT_CONFIG.globals,
          ],
          skills: [
            ...DEFAULT_AGENT_CHECKPOINT_CONFIG.skills,
          ],
        },
        messages: [],
      });

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
    },

    saveCheckpoint,
  };
}

export type AgentStore = ReturnType<
  typeof createAgentStore
>;