import { Elysia } from "elysia";

import {
  ChatParamsSchema,
} from "@flex-builder/shared/chat";
import { RouteDeps } from "../types";

type GetChatRunsRouteDeps = Pick<RouteDeps, 'runRepository'>

export function getChatRunsRoute(
  deps: GetChatRunsRouteDeps,
) {
  return new Elysia().get(
    "/:chatId/items",
    async ({
      params: { chatId },
      set,
    }) => {
      const {
        runRepository,
      } = deps;

      const runs = await runRepository.listRunsByChatId(chatId)

      return {
        runs
      }
    },
    {
      params: ChatParamsSchema,
    },
  );
}