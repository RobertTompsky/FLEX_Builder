import Elysia from "elysia";
import { RunStore } from "../../agents/store/runs";
import { AgentIdentity } from "../../agents/shared/schemas";
import { AgentStore } from "../../agents/store/store";
import { getPendingToolCalls } from "../../shared/utils/getPendingTools";
import { AgentStreamEvent } from "../../events";
import { streamSSE, createSSEWriter } from "../../shared/utils/streamSSE";
import { ResponseInputItem } from "openai/resources/responses/responses.js";
import { AgentRunParamsSchema } from "../schemas";
import { getAgentWorkspacePaths } from "../../agents/shared/utils/workspace";
import { createCheckpointer } from "../../agents/store/checkpointer";
import { AGENTS_STORE_DIR } from "../../shared/data";

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
      const snapshot =
        await agentStore.get(
          agentId,
        );

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

      const controller =
        runStore.get(
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

        if (
          state.activeRequest
        ) {
          const workspace =
            getAgentWorkspacePaths(
              AGENTS_STORE_DIR,
              agentId,
            );

          const checkpointer =
            createCheckpointer(
              workspace.root,
            );

          await checkpointer.save({
            config,

            state: {
              messages:
                removeActiveRequestFromHistory(
                  state.messages,
                ),

              activeRequest:
                null,
            },
          });
        }

        return createStopStream({
          identity:
            snapshot.identity,

          reason:
            "live_abort",
        });
      }

      const pendingTools =
        getPendingToolCalls(
          state.messages,
        );

      /*
       * Paused request уже записан
       * в checkpoint.
       */
      if (
        state.activeRequest &&
        pendingTools.length > 0
      ) {
        const workspace =
          getAgentWorkspacePaths(
            AGENTS_STORE_DIR,
            agentId,
          );

        const checkpointer =
          createCheckpointer(
            workspace.root,
          );

        await checkpointer.save({
          config,

          state: {
            messages:
              removeActiveRequestFromHistory(
                state.messages,
              ),

            activeRequest:
              null,
          },
        });

        return createStopStream({
          identity:
            snapshot.identity,

          reason:
            "paused_cleanup",
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

function createStopStream({
  identity,
  reason,
}: {
  identity: AgentIdentity;
  reason:
  | "live_abort"
  | "paused_cleanup";
}) {
  return streamSSE(async (sse) => {
    const writeAgentSSE =
      createSSEWriter<AgentStreamEvent>(
        sse,
        ({ agent, event }) => ({
          event: event.event,

          data: {
            agent,
            data: event.data,
          },
        }),
      );

    await writeAgentSSE({
      agent: identity,

      event: {
        event: "stop",

        data: {
          reason,
        },
      },
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

  const previousItem =
    history[userMessageIndex - 1];

  if (
    previousItem &&
    "role" in previousItem &&
    previousItem.role === "system"
  ) {
    requestStart--;
  }

  return history.slice(
    0,
    requestStart,
  );
}