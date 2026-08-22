import type { AgentStore } from '../../agents/store/store';
import Elysia from 'elysia';
import { 
    AgentParamsSchema, 
    UpdateAgentBodySchema, 
    UpdateAgentResponse 
} from '@flex-builder/shared/agent';

export function updateAgentRoute(
    store: AgentStore,
) {
    return new Elysia().patch(
        "/:agentId",
        async ({
            params: {
                agentId,
            },
            body,
            set,
        }) => {
            const result = await store.update(
                agentId,
                body,
            );

            if (!result) {
                set.status = 404;

                return {
                    error: "Agent not found",
                };
            }

            return result as UpdateAgentResponse;
        },
        {
            body: UpdateAgentBodySchema,
            params: AgentParamsSchema,
        },

    );
}