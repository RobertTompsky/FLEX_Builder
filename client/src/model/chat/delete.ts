import {
    action,
    wrap,
    withAsync,
} from "@reatom/core";

import type {
    Chat,
} from "@flex-builder/shared/chat";

import {
    chatsApi,
} from "../../api";

import {
    agents,
} from "../agent";

import type {
    AgentModel,
} from "../agent/model";


type DeleteChatResult = {
    deletedAgent:
        boolean;

    remainingChats:
        Chat[];
};

export const deleteChatAction =
    action(
        async ({
            agent,
            chatId,
        }: {
            agent:
                AgentModel;

            chatId:
                string;
        }): Promise<DeleteChatResult> => {

            const currentChats =
                agent.chats();


            if (
                currentChats.length ===
                1
            ) {
                await agents.delete(
                    agent.id,
                );

                return {
                    deletedAgent:
                        true,

                    remainingChats:
                        [],
                };
            }


            await wrap(
                chatsApi.delete({
                    params: {
                        chatId,
                    },
                }),
            );


            const remainingChats =
                currentChats.filter(
                    chat =>
                        chat.id !==
                        chatId,
                );


            agent.chats.set(
                remainingChats,
            );


            return {
                deletedAgent:
                    false,

                remainingChats,
            };
        },

        "chats.delete",
    ).extend(
        withAsync(),
    );