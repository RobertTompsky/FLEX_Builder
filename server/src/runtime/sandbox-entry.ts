import { installGlobals } from "./globals/installGlobals";
import { RuntimeGlobal } from "./globals/types";

const userFile = process.argv.at(2);
const rawGlobals = process.argv.at(3);

if (!userFile) {
  throw new Error("Sandbox user file path is missing");
}

const globals: RuntimeGlobal[] = rawGlobals
  ? JSON.parse(rawGlobals)
  : [];

await installGlobals(globals);

await import(userFile);