import { MODELS } from "@flex-builder/shared/data";
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

export const SERVER_DIR = path.resolve(
  SRC_DIR,
  "..",
);

export const AGENTS_STORE_DIR = path.join(
  SERVER_DIR,
  "data",
  "agents",
)
export const UPLOADS_DIR = path.join(
  SERVER_DIR,
  // "data",
  "uploads",
);

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