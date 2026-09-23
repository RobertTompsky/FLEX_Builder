import { Elysia } from "elysia";

import { RouteDeps } from "../types";
import { ChatParamsSchema } from "@flex-builder/shared/chat";

type DeleteChatRouteDeps = Pick<
    RouteDeps,
    'chatRepository' |
    'workspaceStore'
>

export function deleteChatRoute(
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
                    error: "Chat not found",
                };
            }

            const agentIds = await chatRepository.getAgentIdsByChatId(chatId);

            await chatRepository.delete(chatId);

            for (const agentId of agentIds) {
                await workspaceStore.chat.delete(
                    agentId,
                    chatId,
                );
            }

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