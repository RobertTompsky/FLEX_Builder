import type {
  ResponseInputItem,
} from "openai/resources/responses/responses.js";

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