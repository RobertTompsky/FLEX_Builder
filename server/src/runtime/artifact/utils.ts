import path from "path";
import fs from "fs-extra";
import type { ArtifactInput } from "./schemas";

const REGISTRY_FILE = "registry.json";
const HISTORY_FILE = "history.jsonl";

export type ArtifactOperationType = ArtifactInput["type"];

export type ArtifactHistoryItem = {
  timestamp: string;
  type: ArtifactOperationType;
  filePath: string;
  report: string;
};

export type ArtifactRegistryItem = {
  filePath: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export function registry(baseDir: string) {
  const filePath = path.join(baseDir, REGISTRY_FILE);

  return {
    list(): ArtifactRegistryItem[] {
      if (!fs.existsSync(filePath)) return [];

      return JSON.parse(fs.readFileSync(filePath, "utf8")) as ArtifactRegistryItem[];
    },

    add(item: ArtifactRegistryItem) {
      const items = this.list();

      const exists = items.some((x) => x.filePath === item.filePath);

      if (exists) {
        throw new Error(`Artifact already exists in registry: ${item.filePath}`);
      }

      items.push(item);
      this.save(items);
    },

    find(artifactPath: string): ArtifactRegistryItem | undefined {
      return this.list().find((x) => x.filePath === artifactPath);
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