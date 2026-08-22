import { API_URL, parseResponse } from "./shared";
import {
  fetchEventSource,
} from "@microsoft/fetch-event-source";
import {
  type AgentListItem,
  type AgentParams,
  type AgentRunParams,
  type AgentSnapshot,
  type AgentSSEMessage,
  type ExecuteAgentBody,
  type GetAgentResponse,
  type ToolCallsBody,
  type ToolCallsParams,
  type UIAgentCheckpoint,
  type UpdateAgentBody
} from "@flex-builder/shared/agent"

type RequestOptions = {
  signal?: AbortSignal;
};

type SSEOptions = RequestOptions & {
  onEvent: (
    event: AgentSSEMessage,
  ) => void;
};

async function createAgent({
  options,
}: {
  options?: RequestOptions;
} = {}): Promise<AgentListItem> {
  const response = await fetch(
    `${API_URL}/agents`,
    {
      method: "POST",
      signal: options?.signal,
    },
  );

  return parseResponse<AgentListItem>(
    response,
  );
}

async function updateAgent(
  {
    params,
    body,
    options,
  }: {
    params: AgentParams;
    body: UpdateAgentBody;
    options?: RequestOptions;
  }
): Promise<AgentSnapshot<UIAgentCheckpoint>> {
  const { agentId } = params;

  const response = await fetch(
    `${API_URL}/agents/${encodeURIComponent(
      agentId,
    )}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(body),
      signal: options?.signal,
    },
  );

  return parseResponse<
    AgentSnapshot<UIAgentCheckpoint>
  >(response);
}

async function deleteAgent({
  params,
  options,
}: {
  params: AgentParams;
  options?: RequestOptions;
}): Promise<{
  ok: true;
  agentId: string;
}> {
  const { agentId } = params;

  const response = await fetch(
    `${API_URL}/agents/${encodeURIComponent(
      agentId,
    )}`,
    {
      method: "DELETE",
      signal: options?.signal,
    },
  );

  return parseResponse<{
    ok: true;
    agentId: string;
  }>(response);
}

async function getAgent({
  params,
  options,
}: {
  params: AgentParams;
  options?: RequestOptions;
}): Promise<GetAgentResponse> {
  const { agentId } = params;

  const response = await fetch(
    `${API_URL}/agents/${encodeURIComponent(
      agentId,
    )}`,
    {
      method: "GET",
      signal: options?.signal,
    },
  );

  return parseResponse<GetAgentResponse>(
    response,
  );
}

async function getAgents({
  options,
}: {
  options?: RequestOptions;
} = {}): Promise<AgentListItem[]> {
  const response = await fetch(
    `${API_URL}/agents`,
    {
      method: "GET",
      signal: options?.signal,
    },
  );

  return parseResponse<AgentListItem[]>(
    response,
  );
}

async function executeAgent({
  params,
  body,
  options,
}: {
  params: AgentParams;
  body: ExecuteAgentBody;
  options: SSEOptions;
}): Promise<void> {
  const { agentId } = params;

  await fetchEventSource(
    `${API_URL}/agents/${encodeURIComponent(
      agentId,
    )}/runs`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(body),

      signal: options.signal,

      onmessage(message) {
        if (
          !message.event ||
          !message.data
        ) {
          return;
        }

        console.log(
          "SSE:",
          message.event,
          message.data,
        );

        const data = JSON.parse(
          message.data,
        ) as AgentSSEMessage["data"];

        const event = {
          event: message.event,
          data,
        } as AgentSSEMessage;

        options.onEvent(event);
      },

      onclose() {
        console.log(
          "SSE CLOSED",
        );
      },

      onerror(error) {
        console.error(
          "SSE ERROR:",
          error,
        );

        throw error;
      },
    },
  );
}

export async function approveToolCalls({
  params,
  body,
  options,
}: {
  params: ToolCallsParams;
  body: ToolCallsBody;
  options?: RequestOptions;
}): Promise<ToolCallsBody> {
  const {
    agentId,
    requestId,
  } = params;

  const response = await fetch(
    `${API_URL}/agents/${encodeURIComponent(
      agentId,
    )}/requests/${encodeURIComponent(
      requestId,
    )}/tool-calls/approve`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(body),

      signal: options?.signal,
    },
  );

  return parseResponse<ToolCallsBody>(
    response,
  );
}

export async function stopAgent({
  params,
  options,
}: {
  params: AgentRunParams;
  options: SSEOptions;
}): Promise<void> {
  const {
    agentId,
    runId,
  } = params;

  await fetchEventSource(
    `${API_URL}/agents/${encodeURIComponent(
      agentId,
    )}/runs/${encodeURIComponent(
      runId,
    )}/stop`,
    {
      method: "POST",

      signal: options.signal,

      async onopen(response) {
        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`,
          );
        }
      },

      onmessage(message) {
        if (
          !message.event ||
          !message.data
        ) {
          return;
        }

        const data = JSON.parse(
          message.data,
        ) as AgentSSEMessage["data"];

        options.onEvent({
          event: message.event,
          data,
        } as AgentSSEMessage);
      },

      onerror(error) {
        /**
         * Не позволяем
         * fetch-event-source
         * повторно сделать POST /stop.
         */
        throw error;
      },
    },
  );
}

export const agentsApi = {
  list: getAgents,
  create: createAgent,
  get: getAgent,
  update: updateAgent,
  delete: deleteAgent,
  execute: executeAgent,
  stop: stopAgent,
  approve: approveToolCalls
}