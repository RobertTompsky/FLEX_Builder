import path from "node:path";
import { pathToFileURL } from "node:url";
import z from "zod";

import type {
  LoadedSkill,
  RuntimeAction,
  SkillActions,
} from "./types";

const SkillMetaSchema = z.object({
  description: z.string().min(1),
  access: z.enum(["public", "private"]),
});

const ActionModuleSchema = z.object({
  actions: z.record(z.string(), z.unknown()),
});

function assertRuntimeAction(
  value: unknown,
  actionName: string,
): asserts value is RuntimeAction {
  if (
    !value ||
    typeof value !== "object" ||
    !("description" in value) ||
    !("inputSchema" in value) ||
    !("execute" in value) ||
    typeof value.execute !== "function"
  ) {
    throw new Error(
      `Invalid action "${actionName}" exported from skill.ts`,
    );
  }
}

export async function loadSkill(
  skillsDir: string,
  skillId: string,
): Promise<LoadedSkill> {
  const skillDir = path.join(skillsDir, skillId);

  const meta = SkillMetaSchema.parse(
    await Bun.file(
      path.join(skillDir, "skill.meta.json"),
    ).json(),
  );

  const moduleUrl = pathToFileURL(
    path.join(skillDir, "skill.ts"),
  ).href;

  const module = ActionModuleSchema.parse(
    await import(moduleUrl),
  );

  const actions: SkillActions = {};

  for (const [name, value] of Object.entries(module.actions)) {
    assertRuntimeAction(value, `${skillId}.${name}`);
    actions[name] = value;
  }

  return {
    id: skillId,
    description: meta.description,
    access: meta.access,
    actions,
  };
}

export async function loadSkills(
  skillsDir: string,
  skillIds: string[],
): Promise<LoadedSkill[]> {
  return Promise.all(
    skillIds.map((skillId) =>
      loadSkill(skillsDir, skillId),
    ),
  );
}