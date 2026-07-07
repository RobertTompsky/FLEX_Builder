import z from "zod";
import { agent } from "../../llm/agent";
import { ResponseInputItem } from "openai/resources/responses/responses.js";
import { SKILLS_DIR } from "../../data";
import { getSkillsRegistry } from "../../lib/utils/getSkillsRegistry";
import { RuntimeGlobal } from "../types";
import { SubagentInputSchema, SubagentOutputSchema } from "./schemas";
import { AgentEvent } from "../../llm/types";
import { ArtifactRuntimeEvent, emitRuntimeEvent, RuntimeEvent } from "../events";

export type SubagentInput = z.infer<typeof SubagentInputSchema>;

export type SubagentOutput = z.infer<typeof SubagentOutputSchema>;

const SUBAGENT_MODEL = "gpt-5.4-mini";

function isNestedSubagentEvent(
    event: AgentEvent | RuntimeEvent,
): event is Extract<RuntimeEvent, { event: "subagent_event" }> {
    return event.event === "subagent_event";
}

export async function subagent(input: SubagentInput): Promise<SubagentOutput> {
    const { query, skills } = SubagentInputSchema.parse(input);

    const availableSkills = getSkillsRegistry(SKILLS_DIR)
        .filter((skill) => skills.includes(skill.name));

    const foundSkills = new Set(
        availableSkills.map((skill) => skill.name),
    );

    const unknownSkills = skills.filter(
        (skillName) => !foundSkills.has(skillName),
    );

    if (unknownSkills.length > 0) {
        throw new Error(
            `Unknown subagent skills: ${unknownSkills.join(", ")}`,
        );
    }

    const subagentId = crypto.randomUUID();

    const globals: RuntimeGlobal[] = [
        {
            name: "artifact",
        },
        {
            name: "execute",
            baseDir: SKILLS_DIR,
            available: availableSkills,
        },
    ];

    const messages: ResponseInputItem[] = [
        {
            role: "system",
            content: `
            You are a focused subagent.
            
            Complete the assigned task using the available runtime globals.
            Do not discuss unrelated topics.
            Return the useful final result clearly.
            `.trim(),
            status: "completed",
        },
        {
            role: "user",
            content: query,
            status: "completed",
        },
    ];

    const result = await agent(
        {
            model: SUBAGENT_MODEL,
            messages,
            globals,
            opts: {
                toolRounds: 3,
                sandboxTimeout: 10,
            },
        },
        async (event) => {
            // Внутри субагента subagent-global не установлен,
            // поэтому рекурсивных subagent_event быть не должно.
            if (isNestedSubagentEvent(event)) {
                return;
            }

            emitRuntimeEvent({
                event: "subagent_event",
                data: {
                    subagentId,
                    event: event as AgentEvent | ArtifactRuntimeEvent,
                },
            });
        },
    );

    const lastMessage = [...result.messages]
        .reverse()
        .find(
            (message): message is Extract<ResponseInputItem, { role: "assistant" }> =>
                "role" in message && message.role === "assistant"
        )

    if (!lastMessage) {
        throw new Error("Subagent returned no final assistant message");
    }

    return SubagentOutputSchema.parse({
        text: lastMessage.content
            .filter(
                (item): item is Extract<typeof item, { type: "output_text" }> =>
                    item.type === "output_text",
            )
            .map((item) => item.text)
            .join("\n")
    })
}