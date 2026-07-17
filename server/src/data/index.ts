import path from "path";
import { cwd } from "process";
import { fileURLToPath } from "url";

const DATA_DIR = path.dirname(fileURLToPath(import.meta.url));

export const SRC_DIR = path.resolve(DATA_DIR, "..");
export const SKILLS_DIR = path.join(SRC_DIR, "skills");
export const ARTIFACTS_DIR = path.join(SRC_DIR, "artifacts");
export const UPLOADS_DIR = path.join(
  process.cwd(),
  "data",
  "uploads",
);
export const CHECKPOINTS_DIR = path.join(cwd(), "checkpoints");

export const MODELS = [
  'gpt-5.6-luna',
  'gpt-5.6-terra',
  'gpt-5.4-mini',
]

export const ALLOWED_FILE_EXTENSIONS = new Set([
  '.txt',
  '.md',
  '.json',
  '.csv',
  '.xml',
  '.js',
  '.ts',
])