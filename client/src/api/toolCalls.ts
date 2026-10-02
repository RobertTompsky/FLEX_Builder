import {
    type ChatParams,
} from "@flex-builder/shared/chat";

import {
    API_URL,
    parseResponse,
    type RequestOptions,
} from "./shared";
import type { ApproveToolCallsBody } from "@flex-builder/shared/run";

async function approve({
    params: {
        chatId,
    },
    body,
    options,
}: {
    params: ChatParams;
    body: ApproveToolCallsBody;
    options?: RequestOptions;
}): Promise<{
    ok: true;
    approvedToolCallIds: string[];
}> {
    const response = await fetch(
        `${API_URL}/chats/${encodeURIComponent(chatId)}/tool-calls/approve`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            signal: options?.signal,
        },
    );

    return parseResponse(response);
}

export const toolCallsApi = {
    approve,
};