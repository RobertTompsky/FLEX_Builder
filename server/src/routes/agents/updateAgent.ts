import type { AgentStore, ServerSnapshot } from '../../agents/store/store';
import Elysia from 'elysia';
import {
    AgentParamsSchema,
    UIMessage,
    UpdateAgentBodySchema,
    UpdateAgentResponse
} from '@flex-builder/shared/agent';
import { toUIMessages } from '../../agents/shared/utils';

function toUpdateAgentResponse(
    snapshot: ServerSnapshot,
): UpdateAgentResponse {
    return {
        identity: snapshot.identity,
        checkpoint: {
            updatedAt:
                snapshot.checkpoint.updatedAt,

            data: {
                config:
                    snapshot.checkpoint.data.config,

                state: {
                    ...snapshot.checkpoint.data.state,

                    messages: toUIMessages(
                        snapshot.checkpoint
                            .data.state.messages,
                    ),
                },
            },
        },
    };
}

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

            return toUpdateAgentResponse(result);
        },
        {
            body: UpdateAgentBodySchema,
            params: AgentParamsSchema,
        },

    );
}