import { CAPABILITIES_DIR } from "../shared/data";
import {
  createExecute,
} from "./execute/createExecute";
import { loadCapabilities } from "./execute";

import {
  sandboxGlobal,
} from "./scope";

import type {
  SandboxRuntimeConfig,
} from "./types";

const userFile = process.argv.at(2);

const rawRuntimeConfig = process.env.RUNTIME_CONFIG;

if (!userFile) {
  throw new Error(
    "Sandbox user file path is missing",
  );
}

if (!rawRuntimeConfig) {
  throw new Error(
    "Sandbox runtime config is missing in env",
  );
}

const runtimeConfig = JSON.parse(
  rawRuntimeConfig,
) as SandboxRuntimeConfig;

const capabilities = await loadCapabilities(
  CAPABILITIES_DIR,
  runtimeConfig.capabilityIds,
);

sandboxGlobal.execute = createExecute(
  capabilities,
  runtimeConfig.context
);

await import(userFile);