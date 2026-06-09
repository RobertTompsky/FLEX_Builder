import path from "path";
import { cwd } from "process";
import { fileURLToPath } from "url";

const DATA_DIR = path.dirname(fileURLToPath(import.meta.url));

export const SRC_DIR = path.resolve(DATA_DIR, "..");
export const SKILLS_DIR = path.join(SRC_DIR, "skills");
export const ARTIFACTS_DIR = path.join(SRC_DIR, "artifacts");
export const UPLOADS_DIR = path.join(cwd(), "uploads");

export const MODELS = [
    'gpt-5.4-mini',
    'gpt-5.2-chat-latest',
    'gpt-5.1-chat-latest',
    'gpt-4.1-mini',
    'gpt-4.1-nano'
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