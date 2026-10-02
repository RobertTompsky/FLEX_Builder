import { Elysia } from "elysia";
import { AgentParamsSchema } from "@flex-builder/shared/agent";
import { RouteDeps } from "../types";
import { CreateChatBodySchema } from "@flex-builder/shared/chat";

type CreateChatRouteDeps = Pick<
    RouteDeps, 'agentRepository' | 'chatRepository' | "workspaceStore"
>

export function createChatRoute(
    deps: CreateChatRouteDeps,
) {
    return new Elysia().post(
        "/:agentId/chats",
        async ({
            params: { agentId },
            body: { name },
            set,
        }) => {
            const {
                agentRepository,
                chatRepository,
                workspaceStore
            } = deps;

            const agent = await agentRepository.get(agentId);

            if (!agent) {
                set.status = 404;

                return {
                    ok: false,
                    error: "Agent not found",
                };
            }

            const chat = await chatRepository.create(name);

            await chatRepository.attachToAgent(agentId, chat.id);

            await workspaceStore.chat.create(agentId, chat.id);

            set.status = 201;

            return chat;
        },
        {
            body: CreateChatBodySchema,
            params: AgentParamsSchema,
        },
    );
}