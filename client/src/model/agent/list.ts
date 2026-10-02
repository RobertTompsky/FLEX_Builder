import {
  action,
  withAsyncData,
  wrap,
} from "@reatom/core";

import {
  agentsApi,
} from "../../api/agents";
import type { AgentListItem } from "@flex-builder/shared/agent";

export const agentsList = action(
  async (
    signal?: AbortSignal,
  ): Promise<AgentListItem[]> => {
    return await wrap(
      agentsApi.list({
        options: {
          signal
        }
      }),
    );
  },
  "agentsList",
).extend(
  withAsyncData({
    initState:
      [] as AgentListItem[],
  }),
);