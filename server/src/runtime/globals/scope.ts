import type {
    artifact,
} from "./artifact/artifact";

import type {
    RuntimeExecute,
} from "./execute/types";

import type {
    subagent,
} from "./subagent/subagent";

export type SandboxGlobalScope =
    typeof globalThis & {
        artifact: typeof artifact;
        execute: RuntimeExecute;
        subagent: typeof subagent;
    };

export const sandboxGlobal =
    globalThis as SandboxGlobalScope;