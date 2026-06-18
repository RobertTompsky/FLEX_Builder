import { artifact as artifactFn } from "./artifact/artifact";

globalThis.artifact = artifactFn;

declare global {
    var artifact: typeof artifactFn;
}

export {};