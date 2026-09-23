import {
  randomUUID,
} from "crypto";

import type {
  ResponseInputItem,
} from "openai/resources/responses/responses.js";

import type {
  Chat,
} from "@flex-builder/shared/chat";

import {
  appendChatItems,
  attachToAgent,
  createChat,
  deleteChat,
  getAgentIdsByChatId,
  getChat,
  getChatItems,
  listChatsByAgentId,
} from "./queries";

export interface ChatRepository {
  create(): Promise<Chat>;

  get(
    chatId: string,
  ): Promise<Chat | undefined>;

  getItems(
    chatId: string,
  ): Promise<ResponseInputItem[]>;

  appendItems(
    chatId: string,
    items: ResponseInputItem[],
  ): Promise<void>;

  listChatsByAgentId(agentId: string): Promise<Chat[]>

  delete(
    chatId: string,
  ): Promise<boolean>;

  attachToAgent(agentId: string, chatId: string): Promise<void>

  getAgentIdsByChatId(
    chatId: string,
  ): Promise<string[]>;
}

export const chatRepository = {
  create() {
    return createChat(`chat_${randomUUID()}`);
  },

  listChatsByAgentId,

  get: getChat,

  getItems: getChatItems,

  appendItems: appendChatItems,

  delete: deleteChat,

  attachToAgent,

  getAgentIdsByChatId
} satisfies ChatRepository