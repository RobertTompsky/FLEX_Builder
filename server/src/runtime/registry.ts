import { ARTIFACT_PROMPT } from "./artifact/prompt";
import { createExecute } from "./execute/createExecute";
import { loadSkills } from "./execute/loadSkills";
import { listActions } from "./execute/prompt";
import { RuntimeGlobal } from "./types";
import { artifact as artifactFn } from "./artifact/artifact";
import { buildSubagentPrompt } from "./subagent/prompt";
import { subagent as subagentFn } from "./subagent/subagent";
import z from "zod";
import { ArtifactOutputSchema, ArtifactSchema } from "./artifact/schemas";
import { executeInputSchema, executeOutputSchema } from "./execute/schemas";
import { SubagentInputSchema, SubagentOutputSchema } from "./subagent/schemas";

type GlobalDefinition<TGlobal extends RuntimeGlobal> = {
    description: string;
    inputSchema?: z.ZodTypeAny;
    outputSchema?: z.ZodTypeAny;
    buildPrompt: (global: TGlobal) => Promise<string> | string;
    install: (global: TGlobal) => Promise<void> | void;
};

type RuntimeGlobalRegistry = {
    [TGlobal in RuntimeGlobal as TGlobal["name"]]:
    GlobalDefinition<TGlobal>;
};

export const runtimeGlobalRegistry: RuntimeGlobalRegistry = {

    artifact: {
        description: "Provides controlled filesystem access for traceble reading and creating files.",
        inputSchema: ArtifactSchema,
        outputSchema: ArtifactOutputSchema,

        buildPrompt(_global) {
            return ARTIFACT_PROMPT;
        },

        install(_global) {
            globalThis.artifact = artifactFn;
        },
    },

    execute: {
        description: "Calls validated actions exposed by the selected skills.",
        inputSchema: executeInputSchema,
        outputSchema: executeOutputSchema,

        async buildPrompt(global) {
            return listActions(
                global.baseDir,
                global.available.map((skill) => skill.name),
            );
        },

        async install(global) {
            const skills = await loadSkills(
                global.baseDir,
                global.available.map((skill) => skill.name),
            );

            globalThis.execute = createExecute(skills);
        },
    },

    subagent: {
        description: "Delegates focused work to a separate agent with selected skills.",
        inputSchema: SubagentInputSchema,
        outputSchema: SubagentOutputSchema,
        
        buildPrompt(global) {
            return buildSubagentPrompt(
                global.baseDir,
                global.available.map((skill) => skill.name),
            );
        },

        install(_global) {
            globalThis.subagent = subagentFn;
        },
    }
};