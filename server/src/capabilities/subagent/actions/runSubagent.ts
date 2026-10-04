import z from "zod";

import { randomUUID } from "crypto";

import {
    MODELS,
} from "@flex-builder/shared/data";

import {
    action,
} from "../../../services/capabilities";

import {
    agent,
} from "../../../services/agent/agent";

import type {
    ToolRegistry,
} from "../../../services/tools/types";
import { ResponseInputItem } from "openai/resources/responses/responses";

export const SUBAGENT_CAPABILITY_IDS = [
    "web",
    "crypto",
    "browser",
] as const;

export type SubagentCapabilityId =
    typeof SUBAGENT_CAPABILITY_IDS[number];

export const SubagentCapabilityIdSchema =
    z.enum(
        SUBAGENT_CAPABILITY_IDS,
    );

export const SubagentInputSchema =
    z.object({
        name: z
            .string()
            .min(1)
            .describe(
                "A concise, descriptive role name for the subagent, such as 'researcher', 'planner', or 'code_reviewer'.",
            ),

        query: z
            .string()
            .min(1)
            .describe(
                "A clear, self-contained task for the subagent.",
            ),

        capabilities: z
            .array(SubagentCapabilityIdSchema)
            .superRefine(
                (
                    capabilities,
                    context,
                ) => {
                    const seen = new Set<string>();

                    for (const capability of capabilities) {
                        if (seen.has(capability)) {
                            context.addIssue({
                                code: "custom",
                                message: `Duplicate capability "${capability}"`,
                            });
                        }

                        seen.add(capability);
                    }
                },
            )
            .describe(
                "Capabilities to grant to the subagent.",
            ),
    });

export const SubagentOutputSchema =
    z.object({
        output: z
            .string()
            .describe(
                "Final output produced by the subagent.",
            ),
    });

export type CreateSubagentTools = (
    input: {
        capabilityIds: SubagentCapabilityId[];
        runId: string;
    },
) =>
    | ToolRegistry
    | Promise<ToolRegistry>;

export const runSubagentActionMetadata = {
    description: "Runs a temporary subagent with a focused task and selected capabilities.",
    inputSchema: SubagentInputSchema,
    outputSchema: SubagentOutputSchema,
};

export function createRunSubagentAction({
    createTools
}: {
    createTools: CreateSubagentTools;
}) {
    return action({
        description: runSubagentActionMetadata.description,
        inputSchema: SubagentInputSchema,
        outputSchema: SubagentOutputSchema,
        async execute({
            args,
            options,
        }) {
            const subagentRunId = `run_${randomUUID()}`;

            const tools = await createTools({
                capabilityIds: args.capabilities,
                runId: subagentRunId,
            });

            const messages: ResponseInputItem[] = [
                {
                    role: "user",
                    content: args.query,
                },
            ];

            const result = await agent(
                {
                    model: MODELS.terra,
                    messages,
                    tools,
                    opts: {
                        maxTurns: 2,
                        signal: options.signal,
                    },
                },

                async event => {
                    await options.emit?.({
                        event: "subagent_event",
                        data: {
                            subagentRunId,
                            event,
                        },
                    });
                },
            );

            return {
                output: getLastAssistantText(result.output),
            };
        },
    });
}

function getLastAssistantText(
    messages: ResponseInputItem[],
): string {
    for (let index = messages.length - 1; index >= 0; index--) {
        const message = messages[index];

        if (
            !message ||
            typeof message !== "object" ||
            !("role" in message) ||
            message.role !== "assistant" ||
            !("content" in message)
        ) {
            continue;
        }

        if (typeof message.content === "string") {
            return message.content;
        }

        if (!Array.isArray(message.content)) {
            continue;
        }

        const text = message.content
            .map((item,): string => {
                if (
                    !item ||
                    typeof item !== "object"
                ) {
                    return "";
                }

                if (
                    "type" in item &&
                    item.type === "output_text" &&
                    "text" in item &&
                    typeof item.text === "string"
                ) {
                    return item.text;
                }

                return "";
            })
            .filter(Boolean)
            .join("\n");

        if (text) {
            return text;
        }
    }

    throw new Error(
        "Subagent completed without an assistant output",
    );
}