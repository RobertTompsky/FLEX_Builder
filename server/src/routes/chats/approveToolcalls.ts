import Elysia from "elysia";

import type {
  ResponseInputItem,
} from "openai/resources/responses/responses.js";

import {
  getPendingToolCalls,
} from "../../agents/shared";

import {
  ExecuteAgentParamsSchema,
  ToolCallsBodySchema,
} from "@flex-builder/shared/agent";


import { ChatParamsSchema } from "@flex-builder/shared/chat";
import { RouteDeps } from "../types";

type ApproveToolCallsRouteDeps = Pick<RouteDeps, 'chatRepository'>

export function approveToolCallsRoute(
  deps: ApproveToolCallsRouteDeps,
) {
  return new Elysia().post(
    "/chats/:chatId/tool-calls/approve",
    async ({
      params: {
        chatId,
      },
      body: {
        approvedToolCallIds,
      },
      set,
    }) => {
      const conversation = await deps.chatRepository.get(chatId);

      if (!conversation) {
        set.status = 404;

        return {
          ok: false,
          error: "Conversation not found",
        };
      }

      const history = await deps.chatRepository.getItems(chatId);

      const pending = getPendingToolCalls(history);

      if (pending.length === 0) {
        set.status = 409;

        return {
          ok: false,
          error: "Run is not paused",
        };
      }

      const messages = applyToolCallApproval(history, approvedToolCallIds,);

      await deps.chatRepository.appendItems(chatId, messages.slice(history.length)
      );

      return {
        ok: true,
        approvedToolCallIds,
      };
    },
    {
      body: ToolCallsBodySchema,
      params: ChatParamsSchema,
    },
  );
}

function applyToolCallApproval(
  history: ResponseInputItem[],
  approvedToolCallIds: string[],
): ResponseInputItem[] {
  const pending =
    getPendingToolCalls(history);

  const pendingIds =
    new Set(
      pending.map(
        (call) => call.call_id,
      ),
    );

  for (
    const callId of
    approvedToolCallIds
  ) {
    if (
      !pendingIds.has(callId)
    ) {
      throw new Error(
        `Unknown or already resolved tool call: ${callId}`,
      );
    }
  }

  const approved =
    new Set(
      approvedToolCallIds,
    );

  const rejectedOutputs =
    pending
      .filter(
        (call) =>
          !approved.has(
            call.call_id,
          ),
      )
      .map(
        (
          call,
        ): ResponseInputItem.FunctionCallOutput => ({
          type:
            "function_call_output",

          call_id:
            call.call_id,

          output:
            JSON.stringify({
              ok: false,
              error:
                "tool_use_denied",
              reason:
                "User rejected tool call.",
            }),
        }),
      );

  return [
    ...history,
    ...rejectedOutputs,
  ];
}