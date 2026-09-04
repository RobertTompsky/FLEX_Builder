import { Elysia } from "elysia";

import {
  ChatParamsSchema,
} from "@flex-builder/shared/chat";
import { RouteDeps } from "../types";
import { toUIMessages } from "../../agents/shared";

type GetConversationItemsRouteDeps = Pick<RouteDeps, 'chatRepository'>

export function getConversationItemsRoute(
  deps: GetConversationItemsRouteDeps,
) {
  return new Elysia().get(
    "/:conversationId/items",
    async ({
      params: { chatId },
      set,
    }) => {
      const {
        chatRepository,
      } = deps;

      const conversation = await chatRepository.get(chatId);

      if (!conversation) {
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