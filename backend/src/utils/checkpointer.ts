import type {
  ResponseInput,
  ResponseInputItem,
} from "openai/resources/responses/responses.js";
import fs from "fs-extra"
import path from "path";

type Checkpoint = {
  id: string
  createdAt: number
  messages: ResponseInputItem[]
}

type Checkpointer = {
  save(messages: ResponseInput): Promise<Checkpoint>
  load(): Promise<Checkpoint | null>
}

export function createCheckpointer(
  dir: string
): Checkpointer {

  const ensureDir = async () => {
    await fs.mkdir(dir, { recursive: true })
  }

  const makeId = () =>
    `${Date.now()}-${crypto.randomUUID()}`

  return {
    async save(messages) {
      await ensureDir()

      const cp: Checkpoint = {
        id: makeId(),
        createdAt: Date.now(),
        messages
      }

      const file = path.join(dir, `${cp.id}.json`)
      await fs.writeFile(file, JSON.stringify(cp, null, 2), "utf-8")

      return cp
    },

    async load() {
      try {
        const files = await fs.readdir(dir)
        if (files.length === 0) return null

        const jsonFiles = files.filter(f => f.endsWith(".json"))

        if (jsonFiles.length === 0) return null

        const latest = jsonFiles.sort().at(-1)!
        const file = path.join(dir, latest)

        const raw = await fs.readFile(file, "utf-8")
        return JSON.parse(raw) as Checkpoint
      } catch {
        return null
      }
    },
  }
}