import {
    action,
    atom,
    withAsync,
    wrap,
} from "@reatom/core";

import type {
    Chat,
    UIMessage,
} from "@flex-builder/shared/chat";

import {
    chatsApi,
} from "../../api/chats";
import { createRunModel } from "../run/model";
import type { Run } from "@flex-builder/shared/run";
import { runsApi } from "../../api";

export function createChatModel(
    agentId: string,
    chatId: string,
) {
    const data = atom<Chat | null>(
        null,
        `chats.${chatId}.data`,
    );

    const runs = atom<Run[]>(
        [],
        `chat.${chatId}.runs`,
    );

    const messages = atom<UIMessage[]>(
        [],
        `chats.${chatId}.messages`,
    );

    const load = action(
        async () => {
            await Promise.all([
                loadChat(),
                loadMessages(),
                loadRuns(),
            ]);
        },
        `chats.${chatId}.load`,
    ).extend(
        withAsync(),
    );

    const loadChat = action(
        async () => {
            const response = await wrap(
                chatsApi.get({
                    params: {
                        chatId,
                    },
                }),
            );

            data.set(
                response.chat,
            );
        },
        `chats.${chatId}.loadChat`,
    ).extend(
        withAsync(),
    );

    const loadMessages = action(
        async () => {
            const response = await wrap(
                chatsApi.getItems({
                    params: {
                        chatId,
                    },
                }),
            );

            messages.set(
                response.messages,
            );
        },
        `chats.${chatId}.loadMessages`,
    ).extend(
        withAsync(),
    );

    const loadRuns = action(
        async () => {
            const result =
                await wrap(
                    runsApi.list({
                        params: {
                            chatId,
                        },
                    }),
                );

            runs.set(
                result.runs,
            );
        },
        `chat.${chatId}.loadRuns`,
    ).extend(
        withAsync(),
    );

    const run = createRunModel({
        agentId,
        chatId,
        messages,
    });

    return {
        id: chatId,
        data,
        run,
        runs,
        messages,
        loadChat,
        loadMessages,
        load,
        loadRuns
    };
}

export type ChatModel =
    ReturnType<
        typeof createChatModel
    >;