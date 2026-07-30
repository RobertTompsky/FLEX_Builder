import z from "zod";
import { RuntimeContext } from "../../../runtime/types";
import { ResponseInputItem } from "openai/resources/responses/responses.js";
import { emitRuntimeEvent } from "../../../runtime/events";
import { AgentEnvelopeEvent } from "../../../agents/events";
import { agent } from "../../../agents/harness/agent";
import { MODELS } from "../../../shared/data";
import { AgentState } from "../../../agents/store/checkpointer";
import { AgentCapabilityConfig } from "../../../runtime/execute/schemas";
import { AgentIdentity } from "../../../agents/shared/schemas";
import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs-extra'
import { action } from "../../../runtime/execute";

export const SUBAGENT_CAPABILITY_IDS = [
    "web",
    "crypto",
] as const;

export type SubagentCapabilityId =
    typeof SUBAGENT_CAPABILITY_IDS[number];

export const SubagentCapabilityIdSchema = z.enum(SUBAGENT_CAPABILITY_IDS);

export const SubagentInputSchema = z.object({
    name: z
        .string()
        .min(1)
        .describe("A concise, descriptive role name for the subagent, such as 'researcher', 'planner', or 'code_reviewer'."),
    query: z
        .string()
        .min(1)
        .describe("A clear, self-contained task for the subagent."),
    capabilities: z
        .array(SubagentCapabilityIdSchema)
        // .min(1)
        .superRefine((capabilities, context,) => {
            const seen = new Set<string>();

            for (const capability of capabilities) {
                if (seen.has(capability)) {
                    context.addIssue({
                        code: "custom",
                        message: `Duplicate capability "${capability}"`,
                    });
                }

                seen.add(capability,);
            }
        })
        .describe("Capabilities to grant to the subagent."),
});

export const SubagentOutputSchema = z.object({
    output: z.string().describe("Final output produced by the subagent.",),
});

async function runSubagent(
    rawInput: z.infer<typeof SubagentInputSchema>,
    context: RuntimeContext,
): Promise<z.infer<typeof SubagentOutputSchema>> {
    const input = SubagentInputSchema.parse(
        rawInput,
    );

    const subagentId = `subagent_${randomUUID()}`;

    const subagentRunId = `run_${randomUUID()}`;

    const subagentRequestId = `request_${randomUUID()}`;

    const identity:
        AgentIdentity = {
        id: subagentId,
        name: input.name,
    };

    const workspaceRoot = path.join(
        context.workspaceRoot,
        "subagents",
        subagentId,
    );

    await fs.ensureDir(workspaceRoot);

    const capabilities:
        AgentCapabilityConfig[] =
        input.capabilities.map(
            (id) => ({
                id,
                access: "execute",
            }),
        );

    const messages: ResponseInputItem[] = [
        {
            role: "user",
            content: input.query,
        },
    ];

    const state: AgentState = {
        messages,
        activeRequest: {
            id: subagentRequestId,
            turnsUsed: 0,
        },
    };

    const result = await agent(
        {
            model: MODELS.luna,
            state,
            capabilities,
            runtime: {
                runId: subagentRunId,
                workspaceRoot,
            },
            opts: {
                maxTurns: 3,
                sandboxTimeout: 10,
            },
        },
        identity,
        async (event) => {
            emitRuntimeEvent({
                event: "subagent_event",
                data: {
                    parentRunId: context.runId,
                    parentToolCallId: context.toolCallId,
                    subagentRunId,
                    event,
                },
            });
        },
    );

    const output = getLastAssistantText(
        result.state.messages,
    );

    return SubagentOutputSchema.parse({
        output,
    });
}

function getLastAssistantText(
    messages: ResponseInputItem[],
): string {
    for (
        let index =
            messages.length - 1;

        index >= 0;

        index--
    ) {
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

        if (!Array.isArray(message.content,)
        ) {
            continue;
        }

        const text = message.content
            .map((item,): string => {
                if (
                    !item ||
                    typeof item !==
                    "object"
                ) {
                    return "";
                }

                if (
                    "type" in item &&
                    item.type ===
                    "output_text" &&
                    "text" in item &&
                    typeof item.text ===
                    "string"
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

export const runSubagentAction = action({
    description: "Runs a temporary subagent with a focused task and selected capabilities.",
    inputSchema: SubagentInputSchema,
    outputSchema: SubagentOutputSchema,
    handler: runSubagent,
});