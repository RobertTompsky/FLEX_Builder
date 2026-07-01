import { artifact as artifactFn } from "./artifact/artifact";
import { subagent as subagentFn } from "./subagent/subagent";
import type {
  RuntimeExecute,
} from "./execute/types";
import { runtimeGlobalRegistry } from "./registry";
import { RuntimeGlobal } from "./types";

export async function buildGlobalPrompt(
  global: RuntimeGlobal,
): Promise<string> {
  switch (global.name) {
    case "artifact": {
      const definition = runtimeGlobalRegistry.artifact;

      return `
      ${definition.description}
      
      ${await definition.buildPrompt(global)}
      `.trim();
    }

    case "execute": {
      const definition = runtimeGlobalRegistry.execute;

      return `
      ${definition.description}
      
      ${await definition.buildPrompt(global)}
      `.trim();
    }

    case "subagent": {
      const definition = runtimeGlobalRegistry.subagent;

      return `
      ${definition.description}
      
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