import {
    createAgentModel,
} from "./model";

import type {
    AgentModel,
} from "./model";

const agentModels = new Map<string, AgentModel>();

export function getAgentModel(
    agentId: string,
): AgentModel {
    let model = agentModels.get(agentId);

    if (!model) {
        model = createAgentModel(agentId,);

        agentModels.set(
            agentId,
            model,
        );
    }

    return model;
}

export function deleteAgentModel(
    agentId: string,
): boolean {
    return agentModels.delete(agentId);
}