import path from "path";
import { fileURLToPath } from "url";

const DATA_DIR = path.dirname(fileURLToPath(import.meta.url));

export const SRC_DIR = path.resolve(DATA_DIR, "..");
export const SKILLS_DIR = path.join(SRC_DIR, "skills");
export const ARTIFACTS_DIR = path.join(SRC_DIR, "artifacts");

export const ALLOWED_FILE_FOLDERS = new Set([
  path.resolve(ARTIFACTS_DIR),
  path.resolve(SKILLS_DIR),
]);


export const MODELS = [
    'gpt-5.4-mini',
    'gpt-5.2-chat-latest',
    'gpt-5.1-chat-latest',
    'gpt-4.1-mini',
    'gpt-4.1-nano'
]