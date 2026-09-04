import type {
  Agent,
  AgentConfig,
  AgentListItem,
} from "@flex-builder/shared/agent";

import { db } from "../index";

export async function getAgent(
  agentId: string,
): Promise<Agent | undefined> {
  const row = await db
    .selectFrom("agents")
    .select([
      "id",
      "name",
      "model",
      "prompt",
      "max_turns",
      "pre_tool_use",
      "created_at",
      "updated_at",
    ])
    .where("id", "=", agentId)
    .executeTakeFirst();

  if (!row) {
    return undefined;
  }

  return {
    identity: {
      id: row.id,
      name: row.name,
    },
    config: {
      model: row.model,
      prompt: row.prompt,
      maxTurns: row.max_turns,
      policies: {
        preToolUse: row.pre_tool_use,
      },
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAgents(): Promise<
  AgentListItem[]
> {
  return db
    .selectFrom("agents")
    .select([
      "id",
      "name",
      "updated_at as updatedAt",
    ])
    .orderBy("updated_at", "desc")
    .execute();
}

export async function createAgent(
  agent: Agent,
): Promise<Agent> {
  await db
    .insertInto("agents")
    .values({
      id: agent.identity.id,
      name: agent.identity.name,
      model: agent.config.model,
      prompt: agent.config.prompt,
      max_turns: agent.config.maxTurns,
      pre_tool_use:
        agent.config.policies.preToolUse,
      created_at: agent.createdAt,
      updated_at: agent.updatedAt,
    })
    .execute();

  return agent;
}

export async function updateAgent(
  agentId: string,
  config: AgentConfig,
): Promise<Agent | undefined> {
  const result = await db
    .updateTable("agents")
    .set({
      model: config.model,
      prompt: config.prompt,
      max_turns: config.maxTurns,
      pre_tool_use:
        config.policies.preToolUse,
      updated_at: Date.now(),
    })
    .where("id", "=", agentId)
    .executeTakeFirst();

  if (result.numUpdatedRows === 0n) {
    return undefined;
  }

  return getAgent(agentId);
}

export async function deleteAgent(
  agentId: string,
): Promise<boolean> {
  const result = await db
    .deleteFrom("agents")
    .where("id", "=", agentId)
    .executeTakeFirst();

  return result.numDeletedRows > 0n;
}