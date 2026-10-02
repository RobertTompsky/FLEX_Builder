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

import {
    getAgentModel,
} from "../agent/registry";

import {
    deleteChatModel,
} from "./registry";


type DeleteChatResult = {
    deletedAgent: boolean;
    remainingChats: Chat[];
};


export const deleteChatAction =
    action(
        async ({
            agentId,
            chatId,
        }: {
            agentId: string;
            chatId: string;
        }): Promise<DeleteChatResult> => {
            const agent =
                getAgentModel(
                    agentId,
                );

            const currentChats =
                agent.chats();


            if (
                currentChats.length ===
                1
            ) {
                await agents.delete(
                    agentId,
                );

                deleteChatModel(
                    chatId,
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
                    (chat) =>
                        chat.id !==
                        chatId,
                );


            agent.chats.set(
                remainingChats,
            );


            deleteChatModel(
                chatId,
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