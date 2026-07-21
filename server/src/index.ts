import { Elysia } from "elysia";
import 'dotenv'
import z from "zod";
import fs from 'fs-extra'
import { SKILLS_DIR, MODELS, ALLOWED_FILE_EXTENSIONS, UPLOADS_DIR } from "./shared/data";
import path from 'path'
import { cors } from '@elysia/cors'
import { runtimeGlobalRegistry } from "./runtime/registry";
import { createAgentStore } from "./agents/store";
import { agentsRoutes } from "./routes/agents";
import { createRunStore } from "./agents/runs";

const agentStore = createAgentStore(
  path.join(
    process.cwd(),
    "data",
    "agents",
  ),
);

const runStore = createRunStore();

const fileSchema = z.file().refine((file: File) => {
  const ext = path.extname(file.name).toLowerCase()
  return ALLOWED_FILE_EXTENSIONS.has(ext)
}, {
  error: 'Only text/code files are allowed',
})

const app = new Elysia()
  .use(cors())
  
  .use(agentsRoutes(agentStore, runStore))

  .get("/", () => "Hello Elysia")

  .get('/info', async () => {
    const skills = fs
      .readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    const uploads = fs
      .readdirSync(UPLOADS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    const globals = Object.keys(runtimeGlobalRegistry)
      .sort((a, b) => a.localeCompare(b));

    return {
      uploads,
      globals,
      skills,
      models: MODELS
    }
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

