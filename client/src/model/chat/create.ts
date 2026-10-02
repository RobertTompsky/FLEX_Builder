import type { Chat } from "@flex-builder/shared/chat";
import { action, wrap, withAsync } from "@reatom/core";
import { chatsApi } from "../../api";
import { getAgentModel } from "../agent/registry";

export const createChatAction =
    action(
        async (
            agentId:
                string,

            name:
                string,

            signal?:
                AbortSignal,
        ): Promise<Chat> => {

            const chat =
                await wrap(
                    chatsApi.create({
                        params: {
                            agentId,
                        },

                        body: {
                            name,
                        },

                        options: {
                            signal,
                        },
                    }),
                );

            const agent =
                getAgentModel(
                    agentId,
                );

            agent.chats.set(
                current => [
                    ...current,
                    chat,
                ],
            );

            return chat;
        },
        "chats.create",
    ).extend(
        withAsync(),
    );