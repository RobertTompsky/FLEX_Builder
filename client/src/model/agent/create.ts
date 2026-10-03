import {
  action,
  withAsync,
  wrap,
} from "@reatom/core";

import type {
  AgentListItem,
} from "@flex-builder/shared/agent";

import {
  agentsApi,
} from "../../api/agents";

import {
  agentsList,
} from "./list";


export const createAgentAction = action(
  async (
    signal?: AbortSignal,
  ): Promise<AgentListItem> => {

    const agent =
      await wrap(
        agentsApi.create({
          options: {
            signal,
          },
        }),
      );

    agentsList.data.set(
      agents => {

        const alreadyExists =
          agents.some(
            item =>
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

    return agent;
  },

  "createAgent",
).extend(
  withAsync(),
);