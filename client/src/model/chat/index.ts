import { createChatAction } from "./create";
import { deleteChatAction } from "./delete";
import { getChatModel } from "./registry";

export const chats = {
    get: getChatModel,
    create: createChatAction,
    delete: deleteChatAction,
};