import type { ResponseInputItem } from "openai/resources/responses/responses.js";
import type { Chat } from "@flex-builder/shared/chat";

import { db } from "../index";

function mapChat(row: {
    id: string;
    title: string | null;
    created_at: number;
    updated_at: number;
}): Chat {
    return {
        id: row.id,
        title: row.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function createChat(
    id: string,
): Promise<Chat> {
    await db
        .insertInto("chats")
        .values({
            id,
        })
        .execute();

    return (await getChat(id))!;
}

export async function listChatsByAgentId(
    agentId: string,
): Promise<Chat[]> {
    const rows = await db
        .selectFrom("chats")
        .innerJoin(
            "agent_chats",
            "agent_chats.chat_id",
            "chats.id",
        )
        .select([
            "chats.id",
            "chats.title",
            "chats.created_at",
            "chats.updated_at",
        ])
        .where(
            "agent_chats.agent_id",
            "=",
            agentId,
        )
        .orderBy(
            "chats.created_at",
            "desc",
        )
        .execute();

    return rows.map(mapChat);
}

export async function getChat(
    chatId: string,
): Promise<Chat | undefined> {
    const row = await db
        .selectFrom("chats")
        .select([
            "id",
            "title",
            "created_at",
            "updated_at",
        ])
        .where("id", "=", chatId)
        .executeTakeFirst();

    return row ? mapChat(row) : undefined;
}

export async function getChatItems(
    chatId: string,
): Promise<ResponseInputItem[]> {
    const rows = await db
        .selectFrom("chat_items")
        .select("payload")
        .where("chat_id", "=", chatId)
        .orderBy("id", "asc")
        .execute();

    return rows.map(
        ({ payload }) =>
            JSON.parse(payload) as ResponseInputItem,
    );
}

export async function appendChatItems(
    chatId: string,
    items: ResponseInputItem[],
): Promise<void> {
    if (items.length === 0) {
        return;
    }

    await db
        .insertInto("chat_items")
        .values(
            items.map((item) => ({
                chat_id: chatId,
                payload: JSON.stringify(item),
            })),
        )
        .execute();
}

export async function deleteChat(
    chatId: string,
): Promise<boolean> {
    const result = await db
        .deleteFrom("chats")
        .where("id", "=", chatId)
        .executeTakeFirst();

    return result.numDeletedRows > 0n;
}

export async function attachToAgent(
    agentId: string,
    chatId: string,
): Promise<void> {
    await db
        .insertInto("agent_chats")
        .values({
            agent_id: agentId,
            chat_id: chatId,
        })
        .execute();
}