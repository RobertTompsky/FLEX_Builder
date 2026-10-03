import {
  action,
  atom,
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
  AgentDetails,
  UpdateAgentBody
} from "@flex-builder/shared/agent";
import type { AgentCapabilityConfig } from "@flex-builder/shared/capabilities";
import type { PreToolUsePolicy } from "@flex-builder/shared/hooks";
import type { Chat } from "@flex-builder/shared/chat";

type AgentConfigFormValues = {
  name: UpdateAgentBody["name"];
  model: UpdateAgentBody["config"]["model"];
  prompt: UpdateAgentBody["config"]["prompt"];
  maxTurns: UpdateAgentBody["config"]["maxTurns"];
  policies: {
    preToolUse: PreToolUsePolicy;
  };
  capabilities: AgentCapabilityConfig[];
};

function toFormValues(
  agent: AgentDetails,
): AgentConfigFormValues {
  return {
    name: agent.identity.name,
    model: agent.config.model,
    prompt: agent.config.prompt,
    maxTurns: agent.config.maxTurns,
    policies: agent.config.policies,
    capabilities: agent.capabilities,
  };
}

export function createAgentModel(
  agentId: string,
) {
  const data = atom<
    AgentDetails | null
  >(
    null,
    `agents.${agentId}.data`,
  );

  const chats = atom<Chat[]>(
    [],
    `agents.${agentId}.chats`,
  );

  const configForm =    reatomForm(
      (name) => ({
        name: reatomField(
          "",
          `${name}.name`,
        ),

        model: reatomField(
          "",
          `${name}.model`,
        ),

        prompt: reatomField(
          "",
          `${name}.prompt`,
        ),

        maxTurns: reatomField(
          3,
          `${name}.maxTurns`,
        ),

        maxExecuteConcurrency: reatomField(
          5,
          `${name}.maxExecuteConcurrency`,
        ),

        policies: {
          preToolUse: reatomField<
            PreToolUsePolicy
          >(
            "allow",
            `${name}.policies.preToolUse`,
          ),
        },

        capabilities: reatomField<
          AgentCapabilityConfig[]
        >(
          [],
          `${name}.capabilities`,
        ),
      }),
      {
        name:
          `agents.${agentId}.config`,

        onSubmit: async (state) => {
          const {
            name,
            capabilities,
            model,
            prompt,
            maxTurns,
            policies,
          } = state;

          const agent =
            await wrap(
              agentsApi.update({
                params: {
                  agentId,
                },

                body: {
                  name,

                  config: {
                    model,
                    prompt,
                    maxTurns,
                    policies,
                  },

                  capabilities,
                },
              }),
            );

          setAgent(agent);

          return agent;
        },
      },
    );

  const setAgent = (
    agent: AgentDetails,
  ): void => {
    data.set(
      agent,
    );

    const values =
      toFormValues(
        agent,
      );

    configForm.fields
      .name
      .reset(
        values.name,
      );

    configForm.fields
      .model
      .reset(
        values.model,
      );

    configForm.fields
      .prompt
      .reset(
        values.prompt,
      );

    configForm.fields
      .maxTurns
      .reset(
        values.maxTurns,
      );

    configForm.fields
      .policies
      .preToolUse
      .reset(
        values.policies.preToolUse,
      );

    configForm.fields
      .capabilities
      .reset(
        values.capabilities,
      );

    agentsList.data.set(
      agents =>
        agents.map(
          item =>
            item.id === agentId
              ? {
                ...agent.identity,
                updatedAt:
                  agent.updatedAt,
              }
              : item,
        ),
    );
  };

  const load = action(
    async (
      signal?: AbortSignal
    ): Promise<void> => {
      const agent =
        await wrap(
          agentsApi.get({
            params: {
              agentId,
            },
            options: {
              signal
            }
          }),
        );

      setAgent(agent);

      chats.set(agent.chats);
    },
    `agents.${agentId}.load`,
  ).extend(
    withAsync(),
  );

  return {
    id: agentId,
    data,
    chats,
    configForm,
    load,
  };
}

export type AgentModel =
  ReturnType<
    typeof createAgentModel
  >;