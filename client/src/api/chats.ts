import {
    type AgentParams,
} from "@flex-builder/shared/agent";

import {
    API_URL,
    parseResponse,
    type RequestOptions,
} from "./shared";
import type {
    Chat,
    ChatParams,
    CreateChatBody,
    UIMessage
} from "@flex-builder/shared/chat";

async function create({
    params,
    body,
    options,
}: {
    params: AgentParams;
    body: CreateChatBody;
    options?: RequestOptions;
}): Promise<Chat> {
    const {
        agentId,
    } = params;

    const response = await fetch(
        `${API_URL}/agents/${encodeURIComponent(agentId)}/chats`,
        {
            method: "POST",
            signal: options?.signal,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body)
        },
    );

    return parseResponse<Chat>(response);
}

async function get({
    params: {
        chatId,
    },
    options,
}: {
    params: ChatParams;
    options?: RequestOptions;
}): Promise<{
    chat: Chat;
}> {
    const response = await fetch(
        `${API_URL}/chats/${encodeURIComponent(chatId)}`,
        {
            signal: options?.signal,
        },
    );

    return parseResponse(response);
}

async function remove({
    params: {
        chatId,
    },
    options,
}: {
    params: ChatParams;
    options?: RequestOptions;
}): Promise<{
    ok: true;
    chatId: string;
}> {
    const response = await fetch(
        `${API_URL}/chats/${encodeURIComponent(chatId)}`,
        {
            method: "DELETE",
            signal: options?.signal,
        },
    );

    return parseResponse(response);
}

async function getItems({
    params: {
        chatId,
    },
    options,
}: {
    params: ChatParams;
    options?: RequestOptions;
}): Promise<{
    messages: UIMessage[];
}> {
    const response = await fetch(
        `${API_URL}/chats/${encodeURIComponent(chatId)}/items`,
        {
            signal: options?.signal,
        },
    );

    return parseResponse(response);
}

export const chatsApi = {
    create,
    get,
    delete: remove,
    getItems,
};