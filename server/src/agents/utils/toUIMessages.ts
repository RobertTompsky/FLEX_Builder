import type {
    ResponseInputItem,
} from "openai/resources/responses/responses.js";

export type UIMessage = {
    role: "assistant" | "user";
    content: string;
    status?: "in_progress" | "completed" | "incomplete";
};

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