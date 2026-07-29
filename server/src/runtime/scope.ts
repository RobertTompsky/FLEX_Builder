import type {
    RuntimeExecute,
} from "./execute/types";

export type SandboxGlobalScope =
    typeof globalThis & {
        execute: RuntimeExecute;
    };

export const sandboxGlobal =
    globalThis as SandboxGlobalScope;