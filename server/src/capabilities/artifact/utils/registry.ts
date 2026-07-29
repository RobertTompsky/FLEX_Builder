import path from 'path'
import fs from 'fs-extra'

const REGISTRY_FILE = "registry.json";

type ArtifactRegistryItem = {
  filePath: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export function artifactRegistry(baseDir: string) {
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
      fs.ensureDirSync(
        path.dirname(filePath),
      );
      fs.writeFileSync(filePath, JSON.stringify(items, null, 2), "utf8");
    },
  };
}