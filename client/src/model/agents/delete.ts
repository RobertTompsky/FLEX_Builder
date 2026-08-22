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

import {
    deleteAgentModel,
} from "./registry";

export const deleteAgentAction = action(
    async (
        agentId: string,
    ): Promise<string> => {
        const result = await wrap(
            agentsApi.delete({ params: { agentId } }),
        );

        agentsList.data.set(
            (identities) =>
                identities.filter(
                    (identity) =>
                        identity.id !==
                        result.agentId,
                ),
        );

        deleteAgentModel(result.agentId);

        return result.agentId;
    },
    "agents.delete",
).extend(
    withAsync(),
);