import {
    SKILLS_DIR,
} from "../../shared/data";

import {
    getSkillsRegistry,
} from "../../skills/getSkillsRegistry";

import type {
    RuntimeGlobal,
} from "./types";

import { RuntimeGlobalName } from './registry'

export function buildRuntimeGlobals({
    globals: selectedNames,
    skills: selectedSkillNames,
}: {
    globals: RuntimeGlobalName[];
    skills: string[];
}): RuntimeGlobal[] {
    const selectedGlobals =
        new Set(selectedNames);

    const skillsRegistry =
        getSkillsRegistry(
            SKILLS_DIR,
        );

    const availableSkills =
        skillsRegistry.filter(
            (skill) =>
                selectedSkillNames.includes(
                    skill.name,
                ),
        );

    const globals:
        RuntimeGlobal[] = [];

    if (
        selectedGlobals.has(
            "artifact",
        )
    ) {
        globals.push({
            name: "artifact",
        });
    }

    if (
        selectedGlobals.has(
            "execute",
        )
    ) {
        globals.push({
            name: "execute",
            baseDir: SKILLS_DIR,
            available:
                availableSkills,
        });
    }

    if (
        selectedGlobals.has(
            "subagent",
        )
    ) {
        globals.push({
            name: "subagent",
            baseDir: SKILLS_DIR,
            available:
                availableSkills,
        });
    }

    return globals;
}