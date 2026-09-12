import z from "zod";

import type {
    ResponseInputItem,
} from "openai/resources/responses/responses.js";

import { randomUUID } from "crypto";
import path from "path";
import fs from "fs-extra";

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
import { ArtifactContext } from "../../artifact/actions/types";
import { Workspace } from "../../../services/workspace/types";

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

export type SubagentContext = ArtifactContext

export type CreateSubagentTools = (
    capabilityIds: SubagentCapabilityId[],
    workspace: Workspace,
    runId: string,
) =>
    | ToolRegistry
    | Promise<ToolRegistry>;

export const runSubagentActionMetadata = {
    description: "Runs a temporary subagent with a focused task and selected capabilities.",
    inputSchema: SubagentInputSchema,
    outputSchema: SubagentOutputSchema,
};

async function runSubagent(
    input: z.infer<typeof SubagentInputSchema>,
    context: SubagentContext,
    createTools: CreateSubagentTools,
): Promise<z.infer<typeof SubagentOutputSchema>> {
    const subagentId = `subagent_${randomUUID()}`;

    const subagentRunId = `run_${randomUUID()}`;

    const workspaceRoot = path.join(
        context.workspace.root,
        "subagents",
        subagentId,
    );

    await fs.ensureDir(workspaceRoot);

    const tools = await createTools(
        input.capabilities,
        context.workspace,
        subagentRunId,
    );

    const messages: ResponseInputItem[] = [
        {
            role: "user",
            content: input.query,
        },
    ];

    const result = await agent(
        {
            model: MODELS.terra,
            messages,
            tools,
            opts: {
                maxTurns: 2,
                signal: context.signal
            },
        },

        async (event) => {
            await context.onEvent?.({
                event: "subagent_event",
                data: {
                    parent: context.source,
                    subagent: {
                        runId: subagentRunId,
                    },
                    event,
                },
            });
        },
    );

    const output = getLastAssistantText(result.output);

    return {
        output,
    };
}

export function createRunSubagentAction(
    createTools: CreateSubagentTools,
) {
    return action({
        description: "Runs a temporary subagent with a focused task and selected capabilities.",
        inputSchema: SubagentInputSchema,
        outputSchema: SubagentOutputSchema,

        handler: (
            input,
            context: SubagentContext,
        ) =>
            runSubagent(
                input,
                context,
                createTools,
            ),
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