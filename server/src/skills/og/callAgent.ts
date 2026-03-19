import { agent } from "../../llm/agent";
import { SKILLS_DIR } from "../../data";
import z from "zod";
import { getSkillsRegistry } from "../../lib/utils/getSkillsRegistry";

// Read this array via console.log and choose only necessary skills.  
export const allowedSkills = getSkillsRegistry(SKILLS_DIR).filter(skill => skill.access === 'public')

if (allowedSkills.length === 0) throw new Error("No allowed skills found");

const PublicAgentConfigSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["system", "user"]),
      content: z.string().min(1).max(1000, { error: 'Content length exceeded' }),
      status: z.literal("completed"),
    })
  ).min(1, { error: 'Expected at least one message' }),
  skills: z.object({
    available: z.array(
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

  const allowedSkillsMap = new Map(
    allowedSkills.map((skill) => [skill.name, skill]),
  );

  const agentConfig = {
    ...parsed,
    model: 'gpt-5.4-mini',
    skills: parsed.skills
      ? {
        baseDir: SKILLS_DIR,
        available: parsed.skills.available.map(({ name }) => {
          const skill = allowedSkillsMap.get(name);

          if (!skill) {
            throw new Error(`Unknown allowed skill: ${name}`);
          }

          return {
            name: skill.name,
            description: skill.description,
          };
        }),
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

