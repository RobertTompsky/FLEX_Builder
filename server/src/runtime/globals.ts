import { artifact as artifactFn } from "./artifact/artifact";
import { subagent as subagentFn } from "./subagent/subagent";
import type {
  RuntimeExecute,
} from "./execute/types";
import { RuntimeGlobalNameSchema, runtimeGlobalRegistry } from "./registry";
import { RuntimeGlobal } from "./types";
import z from "zod";
import { SKILLS_DIR } from "../shared/data";
import { getSkillsRegistry } from "../skills/getSkillsRegistry";

function formatGlobalSchemas(
  definition: {
    inputSchema?: z.ZodTypeAny;
    outputSchema?: z.ZodTypeAny;
  },
) {
  return `
  ${definition.inputSchema ? `
  Input schema:
  ${JSON.stringify(z.toJSONSchema(definition.inputSchema), null, 2)}
  ` : ""}
  
  ${definition.outputSchema ? `
  Successful output schema:
  ${JSON.stringify(z.toJSONSchema(definition.outputSchema), null, 2)}
  ` : ""}
  `.trim();
}

async function buildGlobalPrompt(
  global: RuntimeGlobal,
): Promise<string> {
  switch (global.name) {
    case "artifact": {
      const definition = runtimeGlobalRegistry.artifact;

      return `
      ${definition.description}

      ${formatGlobalSchemas(definition)}
      
      ${await definition.buildPrompt(global)}
      `.trim();
    }

    case "execute": {
      const definition = runtimeGlobalRegistry.execute;

      return `
      ${definition.description}

      ${formatGlobalSchemas(definition)}
      
      ${await definition.buildPrompt(global)}
      `.trim();
    }

    case "subagent": {
      const definition = runtimeGlobalRegistry.subagent;

      return `
      ${definition.description}

      ${formatGlobalSchemas(definition)}
      
      ${await definition.buildPrompt(global)}
      `.trim();
    }

    default:
      throw new Error(
        `Unhandled runtime global: ${JSON.stringify(global)}`,
      );
  }
}

export async function buildGlobalsPrompt(
  globals: RuntimeGlobal[],
): Promise<string> {
  const blocks = await Promise.all(
    globals.map(async (global, index) => {
      const prompt = await buildGlobalPrompt(global);

      return `
      ### ${index + 1}) ${global.name}
      
      ${prompt}
      `.trim();
    }),
  );

  return blocks.join("\n\n");
}

export function buildRuntimeGlobals({
    globals: selectedNames,
    skills: selectedSkillNames,
}: {
    globals: z.infer<typeof RuntimeGlobalNameSchema>[];
    skills: string[];
}): RuntimeGlobal[] {
    const selectedGlobals = new Set(
        selectedNames,
    );

    const skillsRegistry = getSkillsRegistry(SKILLS_DIR)

    const availableSkills =
        skillsRegistry.filter((skill) =>
            selectedSkillNames.includes(
                skill.name,
            ),
        );

    const globals: RuntimeGlobal[] = [];

    if (
        selectedGlobals.has("artifact")
    ) {
        globals.push({
            name: "artifact",
        });
    }

    if (
        selectedGlobals.has("execute")
    ) {
        globals.push({
            name: "execute",
            baseDir: SKILLS_DIR,
            available: availableSkills,
        });
    }

    if (
        selectedGlobals.has("subagent")
    ) {
        globals.push({
            name: "subagent",
            baseDir: SKILLS_DIR,
            available: availableSkills,
        });
    }

    return globals;
}

export async function installGlobals(
  globals: RuntimeGlobal[],
): Promise<void> {
  for (const global of globals) {
    switch (global.name) {
      case "artifact":
        await runtimeGlobalRegistry.artifact.install(global);
        break;

      case "execute":
        await runtimeGlobalRegistry.execute.install(global);
        break;

      case "subagent":
        await runtimeGlobalRegistry.subagent.install(global);
        break;
    }
  }
}

declare global {
  var artifact: typeof artifactFn;

  var execute: RuntimeExecute;

  var subagent: typeof subagentFn;
}

export { };