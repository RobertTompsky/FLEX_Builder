import fs from 'fs-extra'
import path from 'path'

export function readDirTree(dir: string, prefix = ""): string {
  const name = path.basename(dir);
  let out = `${prefix}${name}/\n`;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      out += readDirTree(path.join(dir, e.name), prefix + "  ");
    } else {
      out += `${prefix}  ${e.name}\n`;
    }
  }
  return out;
}