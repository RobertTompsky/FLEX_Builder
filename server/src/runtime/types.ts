export type ArtifactGlobal = {
  name: "artifact";
};

export type SkillsRuntimeConfig = {
  baseDir: string;
  available: {
    name: string;
    description?: string;
  }[];
};

export type ExecuteGlobal = {
  name: "execute";
} & SkillsRuntimeConfig;

export type SubagentGlobal = {
  name: "subagent";
} & SkillsRuntimeConfig;

export type RuntimeGlobal =
  | ArtifactGlobal
  | ExecuteGlobal
  | SubagentGlobal