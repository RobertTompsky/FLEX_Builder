import { Elysia } from "elysia";

import {
  ChatParamsSchema,
} from "@flex-builder/shared/chat";
import { RouteDeps } from "../types";

type GetChatRouteDeps = Pick<RouteDeps, 'chatRepository'>

export function getChatRoute(
  deps: GetChatRouteDeps,
) {
  return new Elysia().get(
    "/:chatId",
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

      return {
        chat
      }
    },
    {
      params: ChatParamsSchema,
    },
  );
}