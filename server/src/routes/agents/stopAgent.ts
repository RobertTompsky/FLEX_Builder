import Elysia from "elysia";
import { RunStore } from "../../agents/runs";
import { AgentIdentity } from "../../agents/shared/schemas";
import { AgentStore } from "../../agents/store";
import { getPendingToolCalls } from "../../shared/utils/getPendingTools";
import { AgentStreamEvent } from "../../events";
import { streamSSE, createSSEWriter } from "../../shared/utils/streamSSE";
import { ResponseInputItem } from "openai/resources/responses/responses.js";
import { AgentRunParamsSchema } from "../schemas";

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
      const snapshot = await agentStore.get(
        agentId,
      );

      if (!snapshot) {
        set.status = 404;

        return {
          ok: false,
          error: "Agent not found",
        };
      }

      const controller = runStore.get(
        agentId,
        runId,
      );

      /*
       * Сценарий 1:
       * агент сейчас реально выполняется.
       */
      if (controller) {
        controller.abort();

        return createStopStream({
          identity: snapshot.identity,
          reason: "live_abort",
        });
      }

      /*
       * Сценарий 2:
       * активного процесса уже нет, но агент стоит
       * на паузе и ожидает подтверждения tools.
       */
      const pendingTools = getPendingToolCalls(
        snapshot.checkpoint.data.messages,
      );

      if (pendingTools.length > 0) {
        const cleanedHistory =
          removePausedRunFromHistory(
            snapshot.checkpoint.data.messages,
          );

        await agentStore.saveCheckpoint(
          agentId,
          {
            config: snapshot.checkpoint.data.config,
            messages: cleanedHistory
          }
        );

        return createStopStream({
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

function removePausedRunFromHistory(
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

  let batchStart = userMessageIndex;

  const previousItem =
    history[userMessageIndex - 1];

  if (
    previousItem &&
    "role" in previousItem &&
    previousItem.role === "system"
  ) {
    batchStart--;
  }

  return history.slice(0, batchStart);
}