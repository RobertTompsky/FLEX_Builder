import Elysia from "elysia";
import type { RunStore } from "../../agents/store/runs";
import type { AgentStore } from "../../agents/store/store";
import { streamSSE, createSSEWriter } from "../../sse";
import { ResponseInputItem } from "openai/resources/responses/responses.js";
import { getAgentWorkspacePaths, getPendingToolCalls } from "../../agents/shared/utils";
import { createCheckpointer } from "../../agents/store/checkpointer";
import { AGENTS_STORE_DIR } from "../../shared/data";
import {
  type AgentIdentity,
  AgentRunParamsSchema,
  type AgentSSEMessage
} from "@flex-builder/shared/agent";

export function stopAgentRoute(
  agentStore: AgentStore,
  runStore: RunStore,
) {
  return new Elysia().post(
    "/:agentId/runs/:runId/stop",
    async ({
      params: {
        agentId,
        runId,
      },
      set,
    }) => {
      const snapshot = await agentStore.get(agentId);

      if (!snapshot) {
        set.status = 404;

        return {
          ok: false,
          error:
            "Agent not found",
        };
      }

      const {
        config,
        state,
      } = snapshot.checkpoint.data;

      const controller = runStore.get(
        agentId,
        runId,
      );

      /*
       * Новый request мог ещё не попасть
       * в checkpoint. Тогда старый checkpoint
       * уже является нужным устойчивым состоянием.
       *
       * При resume activeRequest уже сохранён,
       * поэтому его необходимо очистить.
       */
      if (controller) {
        controller.abort();

        if (state.activeRequest) {
          const workspace = getAgentWorkspacePaths(
            AGENTS_STORE_DIR,
            agentId,
          );

          const checkpointer = createCheckpointer(
            workspace.root,
          );

          await checkpointer.save({
            config,
            state: {
              messages:
                removeActiveRequestFromHistory(
                  state.messages,
                ),
              activeRequest: null,
            },
          });
        }

        return sendStopEvent({
          identity: snapshot.identity,
          reason: "live_abort",
        });
      }

      const pendingTools = getPendingToolCalls(state.messages);

      /*
       * Paused request уже записан
       * в checkpoint.
       */
      if (
        state.activeRequest &&
        pendingTools.length > 0
      ) {
        const workspace = getAgentWorkspacePaths(
          AGENTS_STORE_DIR,
          agentId,
        );

        const checkpointer = createCheckpointer(workspace.root);

        await checkpointer.save({
          config,
          state: {
            messages: removeActiveRequestFromHistory(state.messages),
            activeRequest: null,
          },
        });

        return sendStopEvent({
          identity: snapshot.identity,
          reason: "paused_cleanup",
        });
      }

      set.status = 409;

      return {
        ok: false,
        error: "Nothing to stop",
      };
    },
    {
      params: AgentRunParamsSchema,
    },
  );
}

function sendStopEvent({
  identity,
  reason,
}: {
  identity: AgentIdentity;
  reason:
  | "live_abort"
  | "paused_cleanup";
}) {
  return streamSSE(async (sse) => {
    const writeAgentSSE = createSSEWriter<AgentSSEMessage>(sse);

    await writeAgentSSE({
      event: 'stop',
      data: {
        agent: identity,
        data: { reason }
      }
    });
  });
}

function removeActiveRequestFromHistory(
  history: ResponseInputItem[],
): ResponseInputItem[] {
  let userMessageIndex = -1;

  for (
    let index = history.length - 1;
    index >= 0;
    index--
  ) {
    const item = history[index];

    if (
      "role" in item &&
      item.role === "user"
    ) {
      userMessageIndex = index;
      break;
    }
  }

  if (userMessageIndex === -1) {
    return history;
  }

  let requestStart = userMessageIndex;

  const previousItem = history[userMessageIndex - 1];

  if (
    previousItem &&
    "role" in previousItem &&
    previousItem.role === "system"
  ) {
    requestStart--;
  }

  return history.slice(0, requestStart);
}