import {
  action,
  withAsync,
  wrap,
} from "@reatom/core";

import {
  agentsApi,
} from "../../api/agents";

import {
  agentsList,
} from "./list";
import type { AgentListItem } from "@flex-builder/shared/agent";
import { createChatAction } from "../chat/create";

export const createAgentAction =
  action(
    async (
      signal?: AbortSignal,
    ): Promise<AgentListItem> => {
      const agent = await wrap(
        agentsApi.create({
          options: {
            signal
          }
        }
        ),
      );

      agentsList.data.set(
        (agents) => {
          const alreadyExists = agents.some(
            (item) =>
              item.id ===
              agent.id,
          );

          if (alreadyExists) {
            return agents;
          }

          return [
            ...agents,
            agent,
          ];
        },
      );

      await createChatAction(
        agent.id,
        "New Chat",
        signal,
      );

      return agent;
    },
    "createAgent",
  ).extend(
    withAsync(),
  );