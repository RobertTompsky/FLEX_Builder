import fs from 'fs-extra'
import path from 'path'

export function readDirTree(dir: string, prefix = ""): string {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  let out = "";

  for (const e of entries) {
    out += `${prefix}${e.name}\n`;
    if (e.isDirectory()) {
      out += readDirTree(path.join(dir, e.name), prefix + "  ");
    }
  }

  return out;
}