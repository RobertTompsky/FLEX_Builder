import type {
    Chat,
} from "@flex-builder/shared/chat";

import {
    action,
    wrap,
    withAsync,
} from "@reatom/core";

import {
    chatsApi,
} from "../../api";

import type {
    AgentModel,
} from "../agent/model";

export const createChatAction = action(async (
    agent: AgentModel,
    name: string,
    signal?: AbortSignal,
): Promise<Chat> => {
    const chat =
        await wrap(
            chatsApi.create({
                params: {
                    agentId:
                        agent.id,
                },

                body: {
                    name,
                },

                options: {
                    signal,
                },
            }),
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