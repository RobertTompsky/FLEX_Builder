import { z } from 'zod'
import { RuntimeGlobal } from './types';
import { runtimeGlobalRegistry } from './registry';

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