import fs from "fs-extra";
import { randomUUID } from "crypto";

import {
  createAgentWorkspace,
  getAgentWorkspacePaths,
} from "../shared/utils";

import {
  ServerCheckpoint,
  createCheckpointer,
} from "./checkpointer";

import {
  AgentIdentity,
  AgentIdentitySchema,
  AgentListItem,
  AgentSnapshot,
  UpdateAgentBody
} from "@flex-builder/shared/agent";

export type ServerSnapshot = AgentSnapshot<ServerCheckpoint>

const DEFAULT_AGENT_CHECKPOINT_DATA:
  ServerCheckpoint['data'] = {
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

function createDefaultAgentCheckpoint():
  ServerCheckpoint["data"] {
  return DEFAULT_AGENT_CHECKPOINT_DATA
}

export function createAgentStore(
  agentsDir: string,
) {
  async function ensureAgentsDir() {
    await fs.ensureDir(agentsDir);
  }

  async function writeIdentity(
    identity: AgentIdentity,
  ): Promise<void> {
    const paths = getAgentWorkspacePaths(
      agentsDir,
      identity.id,
    );

    await fs.writeJson(
      paths.identity,
      AgentIdentitySchema.parse(
        identity,
      ),
      {
        spaces: 2,
      },
    );
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

    const rawIdentity = await fs.readJson(paths.identity);

    return AgentIdentitySchema.parse(rawIdentity);
  }

  async function getSnapshot(
    agentId: string,
  ): Promise<ServerSnapshot | null> {
    const identity =
      await readIdentity(
        agentId,
      );

    if (!identity) {
      return null;
    }

    const workspace =
      getAgentWorkspacePaths(
        agentsDir,
        agentId,
      );

    const checkpointer =
      createCheckpointer(
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
  }

  async function readListItem(
    agentId: string,
  ): Promise<AgentListItem | null> {
    const snapshot =
      await getSnapshot(agentId);

    if (!snapshot) {
      return null;
    }

    return {
      ...snapshot.identity,
      updatedAt:
        snapshot.checkpoint.updatedAt,
    };
  }

  return {
    async create(): Promise<ServerSnapshot> {
      await ensureAgentsDir();

      const identity = AgentIdentitySchema.parse({
        id: `agent_${randomUUID()}`,
        name: "default",
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

    async list(): Promise<AgentListItem[]> {
      await ensureAgentsDir();

      const entries = await fs.readdir(
        agentsDir,
        {
          withFileTypes: true,
        },
      );

      const items = await Promise.all(
        entries
          .filter((entry) =>
            entry.isDirectory(),
          )
          .map((entry) =>
            readListItem(entry.name),
          ),
      );

      return items.filter(
        (item): item is AgentListItem =>
          item !== null,
      );
    },

    get: getSnapshot,

    async update(
      agentId: string,
      input: UpdateAgentBody,
    ): Promise<ServerSnapshot | null> {
      const snapshot = await getSnapshot(agentId,);

      if (!snapshot) {
        return null;
      }

      const identity = AgentIdentitySchema.parse({
        id: snapshot.identity.id,
        name: input.name,
      });

      const workspace = getAgentWorkspacePaths(
        agentsDir,
        agentId,
      );

      await fs.writeJson(
        workspace.identity,
        identity,
        {
          spaces: 2,
        },
      );

      const checkpointer = createCheckpointer(workspace.root,);

      const checkpoint = await checkpointer.save({
        config: input.config,
        state: snapshot
          .checkpoint
          .data
          .state,
      });

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