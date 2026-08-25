import { Elysia } from "elysia";
import 'dotenv'
import z from "zod";
import fs from 'fs-extra'
import {
  ALLOWED_FILE_EXTENSIONS,
  UPLOADS_DIR,
  AGENTS_STORE_DIR,
} from "./shared/data";
import path from 'path'
import { cors } from '@elysia/cors'
import { createAgentStore } from "./agents/store/store";
import { agentsRoutes, metadataRoutes } from "./routes";
import { createRunStore } from "./agents/store/runs";

const agentStore = createAgentStore(AGENTS_STORE_DIR);

const runStore = createRunStore();

const fileSchema = z.file().refine((file: File) => {
  const ext = path.extname(file.name).toLowerCase()
  return ALLOWED_FILE_EXTENSIONS.has(ext)
}, {
  error: 'Only text/code files are allowed',
})

const app = new Elysia()
  .use(cors())

  .get("/", () => "Марс вечен")

  .use(agentsRoutes(agentStore, runStore))

  .use(metadataRoutes())
  .get('/web', async () => {
    const apiKey =
      process.env.TAVILY_API_KEY?.trim();

    const res = await fetch(
      "https://api.tavily.com/search",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${apiKey}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          query: "bitcoin",
          max_results: 1,
        }),
      },
    );

    console.log({
      status: res.status,
      headers: Object.fromEntries(
        res.headers.entries(),
      ),
      body: await res.text(),
    });
  })
  .post(
    "/upload",
    async ({ body: { files }, set }) => {
      const uploadedFiles = Array.isArray(files) ? files : [files]

      await fs.ensureDir(UPLOADS_DIR)

      try {
        const result = await Promise.all(
          uploadedFiles.map(async (file) => {
            const safeFilename = path.basename(file.name)
            const filepath = path.join(UPLOADS_DIR, safeFilename)

            await Bun.write(filepath, file)

            return {
              filename: safeFilename,
              size: file.size,
              type: file.type,
              path: filepath,
            }
          }),
        )

        return result
      } catch (error) {
        set.status = 500

        return {
          ok: false,
          message: error instanceof Error ? error.message : String(error),
        }
      }
    },
    {
      body: z.object({
        files: z.union([fileSchema, z.array(fileSchema)]),
      }),
    },
  )

  .post(
    "/deleteFiles",
    async ({ body: { files } }) => {
      const deleted: string[] = [];
      const failed: string[] = [];

      await fs.ensureDir(UPLOADS_DIR);

      for (const filename of files) {
        try {
          const safeFilename = path.basename(filename);
          const filePath = path.join(UPLOADS_DIR, safeFilename);

          if (await fs.pathExists(filePath)) {
            await fs.remove(filePath);
            deleted.push(safeFilename);
          }
        } catch {
          failed.push(filename);
        }
      }

      return {
        ok: failed.length === 0,
        deleted,
        failed,
      };
    },
    {
      body: z.object({
        files: z.array(z.string()),
      }),
    },
  )

  .listen(3000);

console.log(
  `Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

