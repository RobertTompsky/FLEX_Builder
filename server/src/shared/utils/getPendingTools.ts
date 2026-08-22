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