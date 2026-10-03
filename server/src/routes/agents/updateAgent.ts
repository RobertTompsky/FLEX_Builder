import { Elysia } from "elysia";

import {
    AgentParamsSchema,
    UpdateAgentBodySchema,
    UpdateAgentResponse,
} from "@flex-builder/shared/agent";

import {
    AgentRepository,
} from "../../db/agents/repository";

import {
    CapabilityRepository,
} from "../../db/capabilities";

type UpdateAgentRouteDeps = {
    agentRepository: AgentRepository;
    capabilityRepository: CapabilityRepository;
};

export function updateAgentRoute(
    deps: UpdateAgentRouteDeps,
) {
    return new Elysia().patch(
        "/:agentId",
        async ({
            params: { agentId },
            body,
            set,
        }) => {
            const {
                agentRepository,
                capabilityRepository,
            } = deps;

            const agent = await agentRepository.get(agentId);

            if (!agent) {
                set.status = 404;

                return {
                    ok: false,
                    error: "Agent not found",
                };
            }

            const updated = await agentRepository.update(
                agentId,
                {
                    name: body.name,
                    config: body.config
                },
            );

            await capabilityRepository.setForAgent(agentId, body.capabilities);

            const capabilities = await capabilityRepository.getByAgentId(agentId)

            return {
                ...updated!,
                capabilities,
            } satisfies UpdateAgentResponse
        },
        {
            body: UpdateAgentBodySchema,
            params: AgentParamsSchema,
        },
    );
}