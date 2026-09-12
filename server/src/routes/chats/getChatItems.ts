import { Elysia } from "elysia";

import {
  ChatParamsSchema,
} from "@flex-builder/shared/chat";
import { RouteDeps } from "../types";
import { toUIMessages } from "../../services/agent/messages";

type GetChatItemsRouteDeps = Pick<RouteDeps, 'chatRepository'>

export function getChatItemsRoute(
  deps: GetChatItemsRouteDeps,
) {
  return new Elysia().get(
    "/:chatId/items",
    async ({
      params: { chatId },
      set,
    }) => {
      const {
        chatRepository,
      } = deps;

      const chat = await chatRepository.get(chatId);

      if (!chat) {
        set.status = 404;

        return {
          ok: false,
          error: "Conversation not found",
        };
      }

      const history = await chatRepository.getItems(chatId);

      return {
        messages: toUIMessages(history)
      }
    },
    {
      params: ChatParamsSchema,
    },
  );
}