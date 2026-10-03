import { createChatAction } from "./create";
import { deleteChatAction } from "./delete";

export const chats = {
    create: createChatAction,
    delete: deleteChatAction,
};