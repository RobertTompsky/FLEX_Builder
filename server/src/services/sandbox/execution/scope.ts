import type {
    ExecuteCall,
} from "../../execute/types";

export type SandboxGlobal = {
    execute?: ExecuteCall;
};

export const sandboxGlobal =
    globalThis as typeof globalThis &
        SandboxGlobal;