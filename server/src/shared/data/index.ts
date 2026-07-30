import path from "path";

export const SRC_DIR =
  path.resolve(
    import.meta.dir,
    "..",
    "..",
  );
// export const SKILLS_DIR = path.join(SRC_DIR, "skills");
export const ARTIFACTS_DIR = path.join(SRC_DIR, "artifacts");
export const CAPABILITIES_DIR = path.join(SRC_DIR, "capabilities");
export const UPLOADS_DIR = path.join(
  process.cwd(),
  "data",
  "uploads",
);

export const AGENTS_STORE_DIR = path.join(
  process.cwd(),
  "data",
  "agents",
)

export const MODELS = {
  luna: "gpt-5.6-luna",
  terra: "gpt-5.6-terra",
} as const;

export type Model = typeof MODELS[keyof typeof MODELS];

export const ALLOWED_FILE_EXTENSIONS = new Set([
  '.txt',
  '.md',
  '.json',
  '.csv',
  '.xml',
  '.js',
  '.ts',
])