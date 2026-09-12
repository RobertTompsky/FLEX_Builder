import type {
    RuntimeExecute,
} from "./types";

type CapabilitySandboxGlobal = {
    execute?: RuntimeExecute;
};

export const capabilitySandboxGlobal =
    globalThis as typeof globalThis &
        CapabilitySandboxGlobal;