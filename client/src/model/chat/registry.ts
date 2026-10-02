import {
    createChatModel,
} from "./model";

import type {
    ChatModel,
} from "./model";

const chatModels =
    new Map<string, ChatModel>();

export function getChatModel(
    agentId: string,
    chatId: string,
): ChatModel {
    let model =
        chatModels.get(chatId);

    if (!model) {
        model = createChatModel(
            agentId,
            chatId,
        );

        chatModels.set(
            chatId,
            model,
        );
    }

    return model;
}

export function deleteChatModel(
    chatId: string,
): boolean {
    return chatModels.delete(chatId);
}