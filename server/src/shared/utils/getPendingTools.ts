import type { ResponseFunctionToolCallItem, ResponseInputItem } from "openai/resources/responses/responses.js"

export function getPendingToolCalls(messages: ResponseInputItem[]) {
  const calls: ResponseFunctionToolCallItem[] = []
  const outputs = new Set<string>()

  for (const m of messages) {
    if (m.type === "function_call") {
      calls.push(m as ResponseFunctionToolCallItem)
    }
    if (m.type === "function_call_output") {
      outputs.add(m.call_id)
    }
  }

  return calls.filter(c => !outputs.has(c.call_id))
}

export function stripPendingToolBranch(history: ResponseInputItem[]) {
  const pendingTools = getPendingToolCalls(history);
  const pendingIds = new Set(pendingTools.map(t => t.call_id));
  const removeIndexes = new Set<number>();

  for (let i = 0; i < history.length; i++) {
    const item = history[i];

    if (item.type === "function_call" && pendingIds.has(item.call_id)) {
      removeIndexes.add(i);

      const prev = history[i - 1];
      if (prev?.type === "reasoning") {
        removeIndexes.add(i - 1);
      }
    }

    if (item.type === "function_call_output" && pendingIds.has(item.call_id)) {
      removeIndexes.add(i);
    }
  }

  return history.filter((_, index) => !removeIndexes.has(index));
}