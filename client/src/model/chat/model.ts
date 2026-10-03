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
        async (
            signal?:
                AbortSignal,
        ) => {
            await Promise.all([
                loadChat(
                    signal,
                ),

                loadMessages(
                    signal,
                ),

                loadRuns(
                    signal,
                ),
            ]);
        },
        `chats.${chatId}.load`,
    ).extend(
        withAsync(),
    );

    const loadChat = action(
        async (
            signal?: AbortSignal,
        ) => {
            const response = await wrap(
                chatsApi.get({
                    params: {
                        chatId,
                    },
                    options: {
                        signal,
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
        async (
            signal?: AbortSignal,
        ) => {
            const response = await wrap(
                chatsApi.getItems({
                    params: {
                        chatId,
                    },
                    options: {
                        signal,
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
        async (
            signal?: AbortSignal,
        ) => {
            const result =
                await wrap(
                    runsApi.list({
                        params: {
                            chatId,
                        },

                        options: {
                            signal,
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
        reloadRuns: loadRuns,
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