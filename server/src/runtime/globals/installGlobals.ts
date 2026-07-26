import { runtimeGlobalRegistry } from "./registry";
import { RuntimeGlobal } from "./types";

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