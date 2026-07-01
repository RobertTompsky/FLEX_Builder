import z from "zod";
import { agent } from "../../llm/agent";
import { ResponseInputItem } from "openai/resources/responses/responses.js";
import { SKILLS_DIR } from "../../data";
import { getSkillsRegistry } from "../../lib/utils/getSkillsRegistry";
import { RuntimeGlobal } from "../types";

export const SubagentInputSchema = z.object({
    query: z
        .string()
        .min(1)
        .describe("A clear, self-contained task for the subagent."),

    skills: z
        .array(z.string().min(1))
        .min(1)
        .describe("Names of skills to grant to the subagent."),
});

export type SubagentInput = z.infer<typeof SubagentInputSchema>;

const SUBAGENT_MODEL = "gpt-5.4-mini";

export async function subagent(input: SubagentInput) {
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

    const result = await agent({
        model: SUBAGENT_MODEL,
        messages,
        globals,
        opts: {
            toolRounds: 3,
            sandboxTimeout: 10,
        },
    });

    const lastMessage = [...result.messages]
        .reverse()
        .find(
            (message): message is Extract<ResponseInputItem, { role: "assistant" }> =>
                "role" in message && message.role === "assistant"
        )

    if (!lastMessage) {
        throw new Error("Subagent returned no final assistant message");
    }

    return lastMessage.content
        .filter(
            (item): item is Extract<typeof item, { type: "output_text" }> =>
                item.type === "output_text",
        )
        .map((item) => item.text)
        .join("\n");
}