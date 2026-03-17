import { agent } from "../../llm/agent";
import fs from 'fs'
import { SKILLS_DIR } from "../../data";
import z from "zod";

export function getAllowedSkills(baseDir: string) {
  return fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'og')
    .map((entry) => ({
      name: entry.name
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Use this array to fill `allowed` field in the `config` object if agent needs all skills to complete task. 
// Otherwise read this array via console.log and choose only necessary skills.  
export const allowedSkills = getAllowedSkills(SKILLS_DIR)

if (allowedSkills.length === 0) throw new Error("No allowed skills found");

const PublicAgentConfigSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["system", "user"]),
      content: z.string().min(1).max(1000, { error: 'Content length exceeded' }),
      status: z.literal("completed"),
    })
  ).min(1, { error: 'Expected at least one message' }),
  model: z.literal("gpt-5.2-chat-latest"),
  skills: z.object({
    // baseDir: z.literal('/skills'),
    allowed: z.array(
      z.object({
        name: z.enum(allowedSkills.map(s => s.name))
      })
    ),
  })
    .optional(),
})

export type PublicAgentConfig = z.infer<typeof PublicAgentConfigSchema>

export async function callAgent(config: PublicAgentConfig) {
  const parsed = PublicAgentConfigSchema.parse(config);

  const agentConfig = {
    ...parsed,
    skills: parsed.skills
      ? {
        ...parsed.skills,
        baseDir: SKILLS_DIR,
      }
      : undefined,
  };

  const result = await agent(agentConfig, async (ev) => {
    if (ev.type === "error") {
      console.error("[agent error]", ev.data.message);
    }
  });

  return result.messages.at(-1)
}

