import {
  API_URL,
  parseResponse,
  type RequestOptions
} from "./shared";
import {
  type AgentListItem,
  type AgentParams,
  type GetAgentResponse,
  type UpdateAgentBody,
  type UpdateAgentResponse
} from "@flex-builder/shared/agent"

async function create({
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

async function list({
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

async function get({
  params,
  options,
}: {
  params: AgentParams;
  options?: RequestOptions;
}): Promise<GetAgentResponse> {
  const {
    agentId,
  } = params;

  const response = await fetch(
    `${API_URL}/agents/${encodeURIComponent(agentId)}`,
    {
      method: "GET",
      signal: options?.signal,
    },
  );

  return parseResponse<GetAgentResponse>(
    response,
  );
}

async function update({
  params,
  body,
  options,
}: {
  params: AgentParams;
  body: UpdateAgentBody;
  options?: RequestOptions;
}): Promise<UpdateAgentResponse> {
  const {
    agentId,
  } = params;

  const response = await fetch(
    `${API_URL}/agents/${encodeURIComponent(agentId)}`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(body),

      signal: options?.signal,
    },
  );

  return parseResponse<UpdateAgentResponse>(response);
}

async function remove({
  params,
  options,
}: {
  params: AgentParams;
  options?: RequestOptions;
}): Promise<{
  ok: true;
  agentId: string;
}> {
  const {
    agentId,
  } = params;

  const response = await fetch(
    `${API_URL}/agents/${encodeURIComponent(agentId)}`,
    {
      method: "DELETE",
      signal: options?.signal,
    },
  );

  return parseResponse<{
    ok: true;
    agentId: string;
  }>(
    response,
  );
}

export const agentsApi = {
  list,
  create,
  get,
  update,
  delete: remove
}