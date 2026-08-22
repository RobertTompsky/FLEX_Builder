import { Elysia } from "elysia";
import 'dotenv'
import z from "zod";
import fs from 'fs-extra'
import { 
  ALLOWED_FILE_EXTENSIONS, 
  UPLOADS_DIR, 
  AGENTS_STORE_DIR, 
  CAPABILITIES_DIR 
} from "./shared/data";
import path from 'path'
import { cors } from '@elysia/cors'
import { createAgentStore } from "./agents/store/store";
import { agentsRoutes } from "./routes/agents";
import { createRunStore } from "./agents/store/runs";
import { listPreToolUsePolicies } from "./agents/harness/hooks/preToolUse/policy";
import { listCapabilities } from "./runtime/execute/resolveCapabilities";
import { MODELS } from "@flex-builder/shared/data";
import { HookPoliciesInfo } from "@flex-builder/shared/hooks";
import { 
  CapabilityAccessSchema 
} from "@flex-builder/shared/capabilities";
import { MetadataResponse } from "@flex-builder/shared/agent";

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

  .use(agentsRoutes(agentStore, runStore))

  .get("/", () => "Марс вечен")

  .get('/metadata', async () => {

    const definitions = await listCapabilities(CAPABILITIES_DIR);

    const uploads = fs
      .readdirSync(UPLOADS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    const policies: HookPoliciesInfo = {
      preToolUse: listPreToolUsePolicies(),
    };

    return {
      uploads,
      models: MODELS,
      capabilities: {
        items: definitions.map(
          ({
            id,
            description,
          }) => ({
            id,
            description,
          }),
        ),
        accessOptions: CapabilityAccessSchema.options,
      },
      policies
    } as MetadataResponse
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

