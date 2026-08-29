import { UIMessage } from "@flex-builder/shared/agent";
import type { ResponseFunctionToolCallItem, ResponseInputItem } from "openai/resources/responses/responses.js"

export function getPendingToolCalls(
  messages: ResponseInputItem[],
): ResponseFunctionToolCallItem[] {
  const completedCallIds = new Set(
    messages
      .filter(
        (item) =>
          item.type === "function_call_output",
      )
      .map((item) => item.call_id),
  );

  return messages.filter(
    (
      item,
    ): item is ResponseFunctionToolCallItem =>
      item.type === "function_call" &&
      !completedCallIds.has(item.call_id),
  );
}

export type AssistantMessage = Extract<
  ResponseInputItem,
  {
    type: "message";
    role: "assistant";
  }
>;

export function isAssistantMessage(
  message: ResponseInputItem,
): message is AssistantMessage {
  return (
    message.type === "message" &&
    message.role === "assistant"
  );
}

export function getLastAssistantMessage(
  messages: ResponseInputItem[],
): AssistantMessage | undefined {
  return messages.findLast(
    isAssistantMessage,
  );
}

function isUIMessage(
  message: ResponseInputItem,
): message is Extract<
  ResponseInputItem,
  { role: "assistant" | "user" }
> {
  return (
    "role" in message &&
    (
      message.role === "assistant" ||
      message.role === "user"
    )
  );
}

export function toUIMessages(
  messages: ResponseInputItem[],
): UIMessage[] {
  return messages
    .filter(isUIMessage)
    .map((message) => ({
      role: message.role,

      content: Array.isArray(message.content)
        ? message.content
            .map((item) =>
              "text" in item
                ? String(item.text)
                : "",
            )
            .filter(Boolean)
            .join("\n")
        : String(message.content),

      status: message.status,
    }));
}