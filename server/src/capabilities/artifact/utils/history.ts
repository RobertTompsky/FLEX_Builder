import path from "path";
import fs from "fs-extra";

const HISTORY_FILE = "history.jsonl";

type ArtifactHistoryItem = {
  timestamp: string;
  type: 'create' | 'read';
  filePath: string;
  report: string;
};

export function artifactHistoryLog(baseDir: string) {
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



