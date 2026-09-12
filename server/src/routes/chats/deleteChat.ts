import { Elysia } from "elysia";

import {
    AgentParamsSchema,
} from "@flex-builder/shared/agent";
import { RouteDeps } from "../types";
import { ChatParamsSchema } from "@flex-builder/shared/chat";

type DeleteChatRouteDeps = Pick<
    RouteDeps,
    'chatRepository' |
    'workspaceStore'
>

export function deleteAgentRoute(
    deps: DeleteChatRouteDeps,
) {
    return new Elysia().delete(
        "/:chatId",
        async ({
            params: { chatId },
            set,
        }) => {
            const {
                chatRepository,
                workspaceStore
            } = deps;

            const isDeleted = await chatRepository.delete(chatId);

            if (!isDeleted) {
                set.status = 404;

                return {
                    ok: false,
                    error: "Agent not found",
                };
            }

            await workspaceStore.delete(agentId);

            return {
                ok: true,
                chatId,
            };
        },
        {
            params: ChatParamsSchema,
        },
    );
}