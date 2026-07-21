import path from 'path'
import fs from 'fs-extra'

export async function createFileContext(files?: string[]) {
  if (!files?.length) return ""

  const uploadsFolder = path.join(process.cwd(), "uploads")

  const blocks = await Promise.all(
    files.map(async (filename) => {
      const safeFilename = path.basename(filename)
      const filepath = path.join(uploadsFolder, safeFilename)

      const content = await fs.readFile(filepath, "utf-8")

      return [
        `--- FILE: ${safeFilename} ---`,
        content,
        `--- END FILE: ${safeFilename} ---`,
      ].join("\n")
    }),
  )

  return blocks.join("\n\n")
}