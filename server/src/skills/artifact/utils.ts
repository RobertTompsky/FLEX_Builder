import path from 'path'
import fs from 'fs-extra'
import type z from 'zod';
import type { ReadSchema, WriteSchema } from './schemas';
import { ARTIFACTS_DIR, SKILLS_DIR } from '../../data';

const REGISTRY_FILE = "registry.json";
const HISTORY_FILE = "history.jsonl";

export const ALLOWED_FOLDERS = [ARTIFACTS_DIR, SKILLS_DIR].map((x) =>
  path.resolve(x),
);

export type ArtifactOperationType = "create" | "update" | "read";

export type ArtifactHistoryItem = Pick<z.infer<typeof ReadSchema>, "filePath" | "report"> & {
  timestamp: string;
  type: ArtifactOperationType;
};

export type ArtifactRegistryItem = Pick<z.infer<typeof WriteSchema>, "filePath" | "description"> & {
  updatedAt: string;
};

export function registry(baseDir: string) {
  const filePath = path.join(baseDir, REGISTRY_FILE);

  return {
    list(): ArtifactRegistryItem[] {
      if (!fs.existsSync(filePath)) return [];
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    },

    save(items: ArtifactRegistryItem[]) {
      fs.writeFileSync(filePath, JSON.stringify(items, null, 2), "utf8");
    },
  };
}

export function historyLog(baseDir: string) {
  const filePath = path.join(baseDir, HISTORY_FILE);

  return {
    append(item: ArtifactHistoryItem) {
      fs.appendFileSync(filePath, JSON.stringify(item) + "\n", "utf8");
    },

    list(): ArtifactHistoryItem[] {
      if (!fs.existsSync(filePath)) return [];

      return fs
        .readFileSync(filePath, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as ArtifactHistoryItem);
    },
  };
}