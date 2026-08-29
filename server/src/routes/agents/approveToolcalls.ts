import Elysia from "elysia";
import { AgentStore } from "../../agents/store/store";
import { createCheckpointer } from "../../agents/store/checkpointer";
import { getAgentWorkspacePaths, getPendingToolCalls } from "../../agents/shared";
import { AGENTS_STORE_DIR } from "../../shared/data";
import { ResponseInputItem } from "openai/resources/responses/responses.js";
import { ToolCallsBodySchema } from "@flex-builder/shared/agent";

export function approveToolCallsRoute(
  agentStore: AgentStore,
) {
  return new Elysia().post(
    "/:agentId/requests/:requestId/tool-calls/approve",
    async ({
      params: {
        agentId,
        requestId,
      },
      body: {
        approvedToolCallIds,
      },
      set,
    }) => {
      const snapshot = await agentStore.get(agentId);

      if (!snapshot) {
        set.status = 404;

        return {
          ok: false,
          error: "Agent not found",
        };
      }

      const {
        config,
        state,
      } = snapshot.checkpoint.data;

      if (
        !state.activeRequest ||
        state.activeRequest.id !== requestId
      ) {
        set.status = 409;

        return {
          ok: false,
          error: "Run is not paused",
        };
      }

      const workspace = getAgentWorkspacePaths(
        AGENTS_STORE_DIR,
        agentId,
      );

      const checkpointer = createCheckpointer(workspace.root);

      const messages =
        applyToolCallApproval(
          state.messages,
          approvedToolCallIds,
        );

      await checkpointer.save({
        config,
        state: {
          ...state,
          messages,
        },
      });

      return {
        ok: true,
        approvedToolCallIds,
      };
    },
    {
      body: ToolCallsBodySchema,
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