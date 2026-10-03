import {
    fetchEventSource,
} from "@microsoft/fetch-event-source";

import {
    type AgentSSEMessage,
} from "@flex-builder/shared/agent";

import {
    API_URL,
    parseResponse,
    type RequestOptions,
    type SSEOptions,
} from "./shared";
import type { ChatParams } from "@flex-builder/shared/chat";
import type {
    Run,
    StartRunBody,
    StartRunParams,
    StopRunParams
} from "@flex-builder/shared/run";

async function list({
    params: {
        chatId,
    },
    options,
}: {
    params: ChatParams;
    options?: RequestOptions;
}): Promise<{
    runs: Run[];
}> {
    const response = await fetch(
        `${API_URL}/chats/${encodeURIComponent(chatId)}/runs`,
        {
            signal: options?.signal,
        },
    );

    return parseResponse(response);
}

function parseAgentSSEMessage(
    message: {
        event: string;
        data: string;
    },
): AgentSSEMessage {
    return {
        event: message.event,
        data: JSON.parse(message.data),
    } as AgentSSEMessage;
}

async function start({
    params: {
        agentId,
        chatId,
    },
    body,
    options,
}: {
    params: StartRunParams;
    body: StartRunBody;
    options: SSEOptions<AgentSSEMessage>;
}): Promise<void> {
    await fetchEventSource(
        `${API_URL}/agents/${encodeURIComponent(agentId)}/chats/${encodeURIComponent(chatId)}/runs`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
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

                options.onEvent(
                    parseAgentSSEMessage(message),
                );
            },
            onerror(error) {
                throw error;
            },
        },
    );
}

async function stop({
    params: {
        agentId,
        chatId,
        runId,
    },
    options,
}: {
    params: StopRunParams;
    options?: RequestOptions;
}): Promise<void> {

    const response = await fetch(
        `${API_URL}/agents/${encodeURIComponent(
            agentId,
        )}/chats/${encodeURIComponent(
            chatId,
        )}/runs/${encodeURIComponent(
            runId,
        )}/stop`,
        {
            method: "POST",
            signal: options?.signal,
        },
    );

    await parseResponse(response);
}

export const runsApi = {
    list,
    start,
    stop,
};