import { Elysia } from "elysia";
import { randomUUID } from "crypto";
import { Agent, AgentListItem } from "@flex-builder/shared/agent";
import { RouteDeps } from "../types";

export type CreateAgentRouteDeps = Pick<
  RouteDeps,
  "workspaceStore" | "agentRepository"
>;

export function createAgentRoute(
  deps: CreateAgentRouteDeps,
) {
  return new Elysia().post(
    "/",
    async ({ set }) => {
      const {
        workspaceStore,
        agentRepository,
      } = deps;

      const now = Date.now();

      const agent: Agent = {
        identity: {
          id: `agent_${randomUUID()}`,
          name: "New Agent",
        },
        config: {
          model: "",
          prompt: "",
          maxTurns: 3,
          policies: {
            preToolUse: "allow",
          },
        },
        createdAt: now,
        updatedAt: now,
      };

      agentRepository.create(agent);

      try {
        await workspaceStore.create(
          agent.identity.id,
        );
      } catch (error) {
        agentRepository.delete(
          agent.identity.id,
        );

        throw error;
      }

      set.status = 201;

      const listItem: AgentListItem = {
        ...agent.identity,
        updatedAt: agent.updatedAt,
      };

      return listItem;
    },
  );
}