import z from "zod";
import { Action } from "../types";

type ActionDefinition = Omit<Action, 'execute'>

type CapabilityActions = Record<string, ActionDefinition>;

function formatSchema(
  schema: z.ZodType,
): string {
  return JSON.stringify(
    z.toJSONSchema(schema),
    null,
    2,
  );
}

function buildActionPrompt(
  actionName: string,
  action: ActionDefinition,
): string {
  return [
    `### ${actionName}`,
    "",
    action.description,
    "",
    "Input schema:",
    "```json",
    formatSchema(action.inputSchema),
    "```",
    "",
    "Successful output schema:",
    "```json",
    formatSchema(action.outputSchema),
    "```",
  ].join("\n");
}

export function buildActionsPrompt(
  actions: CapabilityActions,
): string {
  return Object.entries(actions)
    .map(([actionName, action]) =>
      buildActionPrompt(
        actionName,
        action,
      ),
    )
    .join("\n\n");
}