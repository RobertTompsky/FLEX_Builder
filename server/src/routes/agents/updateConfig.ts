import z from 'zod'
import { AgentCheckpointConfigSchema } from '../../agents/store/checkpointer';
import { AgentStore } from '../../agents/store/store';
import Elysia from 'elysia';
import { AgentParamsSchema } from '../schemas';

const UpdateAgentSchema = z.object({
    name: z
        .string()
        .min(1),
    config: AgentCheckpointConfigSchema,
});

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

            return result;
        },
        {
            body: UpdateAgentSchema,
            params: AgentParamsSchema
        },

    );
}