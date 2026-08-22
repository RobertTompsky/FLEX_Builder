import {
  action,
  atom,
  computed,
  reatomField,
  reatomForm,
  withAsync,
  wrap,
} from "@reatom/core";

import {
  agentsApi,
} from "../../api/agents";

import { agentsList } from "./list";
import type {
  AgentSSEMessage,
  ExecuteAgentBody,
  GetAgentResponse,
  UIMessage,
  UpdateAgentBody
} from "@flex-builder/shared/agent";
import type { AgentCapabilityConfig } from "@flex-builder/shared/capabilities";
import type { PreToolUsePolicy } from "@flex-builder/shared/hooks";

// type AgentConfigFormValues = {
//   name: string;
// } & AgentCheckpointConfig;

type AgentRunStatus =
  | "idle"
  | "running"
  | "paused"
  | "stopped"
  | "completed"
  | "error";

type AgentConfigFormValues = {
  name: UpdateAgentBody["name"];
} & UpdateAgentBody["config"];

function toAgentConfigFormValues(
  agent: GetAgentResponse,
): AgentConfigFormValues {
  const config =
    agent.checkpoint?.data.config;

  return {
    name: agent.identity.name,
    model: config?.model ?? "",
    prompt: config?.prompt ?? "",
    maxTurns: config?.maxTurns ?? 3,

    capabilities:
      config?.capabilities.map(
        (capability) => ({
          ...capability,
        }),
      ) ?? [],

    policies: {
      preToolUse:
        config?.policies
          .preToolUse ??
        "allow",
    },
  };
}

export function createAgentModel(
  agentId: string,
) {
  const snapshot = atom<
    GetAgentResponse | null
  >(
    null,
    `agents.${agentId}.snapshot`,
  );

  const messages = atom<UIMessage[]>(
    [],
    `agents.${agentId}.messages`,
  );

  const syncSnapshot = (
    nextSnapshot: GetAgentResponse,
  ): void => {
    snapshot.set(
      nextSnapshot,
    );

    messages.set(
      nextSnapshot
        .checkpoint
        ?.data.state.messages ??
      [],
    );

    configForm.reset(
      toAgentConfigFormValues(
        nextSnapshot,
      ),
    );

    const updatedAt =
      nextSnapshot
        .checkpoint
        ?.updatedAt;

    if (
      updatedAt !== undefined
    ) {
      agentsList.data.set(
        (agents) =>
          agents.map(
            (agent) =>
              agent.id === agentId
                ? {
                  ...nextSnapshot.identity,
                  updatedAt,
                }
                : agent,
          ),
      );
    }
  };

  const configForm =
    reatomForm(
      (name) => ({
        name: reatomField(
          "",
          `${name}.name`,
        ),

        model: reatomField(
          "",
          `${name}.model`,
        ),

        maxTurns: reatomField(
          3,
          `${name}.maxTurns`,
        ),

        prompt: reatomField(
          "",
          `${name}.prompt`,
        ),

        capabilities: reatomField<
          AgentCapabilityConfig[]
        >(
          [],
          `${name}.capabilities`,
        ),

        policies: {
          preToolUse: reatomField<
            PreToolUsePolicy
          >(
            "allow",
            `${name}.policies.preToolUse`,
          ),
        },
      }),
      {
        name:
          `agents.${agentId}.configForm`,

        onSubmit: async (
          state,
        ) => {
          const {
            name,
            ...config
          } = state;

          const nextSnapshot = await wrap(
            agentsApi.update({
              params: {
                agentId
              },
              body: {
                name,
                config
              }
            }
            ),
          );

          syncSnapshot(nextSnapshot);

          return nextSnapshot;
        },
      },
    );

  const load = action(
    async (): Promise<void> => {
      const nextSnapshot = await wrap(agentsApi.get({
        params: {
          agentId
        }
      }
      ));

      syncSnapshot(nextSnapshot);
    },
    `agents.${agentId}.load`,
  ).extend(
    withAsync(),
  );

  const events = atom<
    AgentSSEMessage[]
  >(
    [],
    `agents.${agentId}.run.events`,
  );

  const send = action(
    async (
      input: ExecuteAgentBody,
    ): Promise<void> => {
      const currentEvents = events();

      const lastSSE = currentEvents.at(-1);

      const isFinished =
        lastSSE?.event === "end" ||
        lastSSE?.event === "error" ||
        lastSSE?.event === "stop";

      const isPaused =
        lastSSE?.event === "pause";

      if (
        currentEvents.length > 0 &&
        !isFinished &&
        !isPaused
      ) {
        throw new Error(
          "Agent run is already active",
        );
      }

      if (isFinished) {
        events.set([]);
      }

      if (input.query) {
        messages.set((current) => [
          ...current,
          {
            role: "user",
            content: input.query!,
            status: "completed",
          },
        ]);
      }

      await wrap(
        agentsApi.execute(
          {
            params: {
              agentId
            },
            body: input,
            options: {
              onEvent(event) {
                events.set(
                  (current) => [
                    ...current,
                    event,
                  ],
                );

                switch (event.event) {
                  case "text_delta": {
                    const delta =
                      event.data.data.delta;

                    messages.set(
                      (current) => {
                        const lastMessage =
                          current.at(-1);

                        if (
                          lastMessage?.role ===
                          "assistant" &&
                          lastMessage.status ===
                          "in_progress"
                        ) {
                          return [
                            ...current.slice(
                              0,
                              -1,
                            ),
                            {
                              ...lastMessage,
                              content:
                                lastMessage.content +
                                delta,
                            },
                          ];
                        }

                        return [
                          ...current,
                          {
                            role:
                              "assistant",
                            content:
                              delta,
                            status:
                              "in_progress",
                          },
                        ];
                      },
                    );

                    break;
                  }

                  case "text_end": {
                    messages.set(
                      (current) => {
                        const lastMessage =
                          current.at(-1);

                        if (
                          lastMessage?.role !==
                          "assistant" ||
                          lastMessage.status !==
                          "in_progress"
                        ) {
                          return current;
                        }

                        return [
                          ...current.slice(
                            0,
                            -1,
                          ),
                          {
                            ...lastMessage,
                            status:
                              "completed",
                          },
                        ];
                      },
                    );

                    break;
                  }

                  case "error":
                  case "stop": {
                    messages.set(
                      (current) => {
                        const lastMessage =
                          current.at(-1);

                        if (
                          lastMessage?.role !==
                          "assistant" ||
                          lastMessage.status !==
                          "in_progress"
                        ) {
                          return current;
                        }

                        return [
                          ...current.slice(
                            0,
                            -1,
                          ),
                          {
                            ...lastMessage,
                            status:
                              "incomplete",
                          },
                        ];
                      },
                    );

                    break;
                  }
                }
              },
            }
          }
        ),
      );

      const finalEvent =
        events().at(-1);

      if (
        finalEvent?.event ===
        "pause" ||
        finalEvent?.event ===
        "end" ||
        finalEvent?.event ===
        "stop" ||
        finalEvent?.event ===
        "error"
      ) {
        const nextSnapshot =
          await wrap(
            agentsApi.get({
              params: {
                agentId
              }
            }
            ),
          );

        syncSnapshot(nextSnapshot);
      }
    },
    `agents.${agentId}.run.send`,
  ).extend(
    withAsync(),
  );

  const runId = computed(
    () => {
      const init =
        events().find(
          (
            event,
          ): event is Extract<
            AgentSSEMessage,
            { event: "init" }
          > =>
            event.event ===
            "init",
        );

      return (
        init?.data.data.runId ??
        null
      );
    },
    `agents.${agentId}.run.id`,
  );

  const status = computed((): AgentRunStatus => {
    const currentEvents = events();

    if (currentEvents.length === 0) {
      return "idle";
    }

    const lastEvent = currentEvents.at(-1);

    switch (lastEvent?.event) {
      case "end":
        return "completed";
      case "pause":
        return "paused";
      case "stop":
        return "stopped";
      case "error":
        return "error";
      default:
        return "running";
    }
  },
    `agents.${agentId}.run.status`,
  );

  const resume = action(
    async (
      approvedToolCallIds: string[],
    ): Promise<void> => {
      const requestId =
        snapshot()
          ?.checkpoint
          ?.data.state
          .activeRequest
          ?.id;

      if (!requestId) {
        throw new Error(
          "No paused request",
        );
      }

      await wrap(agentsApi.approve({
        params: {
          agentId,
          requestId
        },
        body: {
          approvedToolCallIds
        }
      }));

      const {
        name: _name,
        ...config
      } = configForm();

      await send({
        ...config,
        query: null,
      });
    },
    `agents.${agentId}.run.resume`,
  ).extend(
    withAsync(),
  );

  const stop = action(
    async (): Promise<void> => {
      const currentRunId =
        runId();

      if (!currentRunId) {
        throw new Error(
          "Agent run ID is missing",
        );
      }

      await wrap(agentsApi.stop(
        {
          params: {
            agentId,
            runId: currentRunId
          },
          options: {
            onEvent(event) {
              {
                events.set((current) => [
                  ...current,
                  event,
                ],
                );

                if (
                  event.event ===
                  "stop"
                ) {
                  messages.set(
                    (current) => {
                      const lastMessage = current.at(-1);

                      if (
                        lastMessage?.role !==
                        "assistant" ||
                        lastMessage.status !==
                        "in_progress"
                      ) {
                        return current;
                      }

                      return [
                        ...current.slice(0, -1),
                        {
                          ...lastMessage,
                          status: "incomplete",
                        },
                      ];
                    },
                  );
                }
              }
            },
          }
        }
      ),
      );
    },
    `agents.${agentId}.run.stop`,
  ).extend(
    withAsync(),
  );

  return {
    id: agentId,
    configForm,
    snapshot,
    messages,
    load,
    run: {
      id: runId,
      events,
      send,
      resume,
      stop,
      status
    }
  };
}

export type AgentModel =
  ReturnType<
    typeof createAgentModel
  >;