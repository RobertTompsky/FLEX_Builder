import { Elysia } from "elysia";
import 'dotenv'
import z from "zod";
import { SSE, streamSSE } from "./lib/utils/streamSSE";
import { Emit, AgentEvent } from "./llm/types";
import fs from 'fs-extra'
import { SKILLS_DIR, MODELS, ALLOWED_FILE_EXTENSIONS, UPLOADS_DIR } from "./data";
import { createCheckpointer } from "./lib/utils/checkpointer";
import { getPendingToolCalls } from './lib/utils/getPendingTools'
import path from 'path'
import { getSkillsRegistry } from "./lib/utils/getSkillsRegistry";
import { agent, CodeGenSchema } from "./llm/agent";
import { cors } from '@elysia/cors'
import { ResponseInputItem } from "openai/resources/responses/responses.js";
import { executeCode } from "./code/executeCode";
import { artifact } from "./runtime/artifact/artifact";
import { RuntimeEvent } from "./runtime/events";

const runs = new Map<string, AbortController>();

const checkpointer = createCheckpointer('checkpoints/session228')

type UIMessage = {
  role: "assistant" | "user";
  content: string;
  status?: "in_progress" | "completed" | "incomplete";
};

const fileSchema = z.file().refine((file: File) => {
  const ext = path.extname(file.name).toLowerCase()
  return ALLOWED_FILE_EXTENSIONS.has(ext)
}, {
  message: 'Only text/code files are allowed',
})

function createSSEWriter(s: SSE): Emit<AgentEvent | RuntimeEvent> {
  return async ({ event, data }) => {
    await s.send({
      event,
      data: JSON.stringify(data),
    });
  };
}

const app = new Elysia()
  .use(cors())
  .get("/", () => "Hello Elysia")
  .get('/info', async () => {
    const skills = fs
      .readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    const isUIMessage = (m: ResponseInputItem): m is UIMessage =>
      "role" in m && (m.role === "assistant" || m.role === "user");

    const history = (await checkpointer.load())?.data.messages ?? []

    const uiHistory: UIMessage[] = history
      .filter(isUIMessage)
      .map((m) => ({
        role: m.role,
        content: Array.isArray(m.content)
          ? String(m.content[0].text)
          : String(m.content),
        status: m.status
      }));

    const uploads = fs
      .readdirSync(UPLOADS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    return {
      uploads,
      skills,
      models: MODELS,
      uiHistory
    }
  })
  .get('/clearHistory', async () => {
    await checkpointer.clear()
    return JSON.stringify({ ok: true })
  })
  .post(
    '/mcp/:runId',
    async ({ body, params: { runId }, request: { signal } }) => {
      const ac = new AbortController()
      signal.addEventListener("abort", () => ac.abort(), { once: true })
      runs.set(runId, ac);

      let history = (await checkpointer.load())?.data.messages.filter(
        m => !("role" in m && m.role === "system")
      ) ?? []

      const isResume = body.query === null;

      const filesContext = body.files && body.files.length > 0
        ? JSON.stringify(
          await Promise.all(
            body.files.map(async (filename) => {
              const safeFilename = path.basename(filename)
              const filePath = path.join(UPLOADS_DIR, safeFilename)
              console.log(filePath)

              return {
                filename: safeFilename,
                content: await fs.readFile(filePath, 'utf8'),
              }
            }),
          ),
          null,
          2,
        )
        : ''

      return streamSSE(async (s) => {
        const writeAgentSSE = createSSEWriter(s)

        try {
          const result = await agent(
            {
              model: body.model,
              messages: [
                ...history,
                {
                  role: "system",
                  content: [
                    body.prompt ?? '',
                    filesContext
                      ? [
                        'Attached files:',
                        filesContext,
                      ].join('\n')
                      : '',
                    "For all external data you **must** read only files from the skills directory to discover tools and call the appropriate one.",
                    "Consider having all needed functions and info in the skills directory. You can use them directly by imports."
                  ].join('\n'),
                  status: 'completed'
                },
                ...(isResume
                  ? []
                  : [{
                    role: "user",
                    content: body.query,
                    status: 'completed'
                  } as UIMessage])
              ],
              skills: {
                baseDir: SKILLS_DIR,
                available: getSkillsRegistry(SKILLS_DIR).filter(skill => body.skills?.includes(skill.name))
              },
              pause: body.pause,
              opts: {
                toolRounds: body.toolRounds,
                signal: ac.signal
              }
            },
            writeAgentSSE
          )

          if (!ac.signal.aborted) {
            await checkpointer.save({ messages: result.messages })
          }
        } finally {
          runs.delete(runId);
        }
      })
    },
    {
      body: z.object({
        query: z.string().nullable(),
        model: z.string(),
        prompt: z.string().optional(),
        files: z.array(z.string()).optional(),
        toolRounds: z.number().optional(),
        skills: z.array(z.string()).optional(),
        pause: z.boolean().optional(),
      }),
      params: z.object({
        runId: z.string()
      })
    }
  )
  .post(
    '/handleToolcalls',
    async ({ body }) => {

      let history = (await checkpointer.load())?.data.messages ?? []

      const pendingTools = getPendingToolCalls(history)

      const approvedTools = pendingTools.filter(t => body.toolCallIds?.includes(t.call_id))

      const approvedIds = new Set(approvedTools.map((t) => t.call_id));
      const callOutputIds = new Set(
        history
          .filter(
            (m): m is ResponseInputItem.FunctionCallOutput =>
              m.type === "function_call_output"
          )
          .map((m) => m.call_id)
      );

      const pendingIds = new Set(pendingTools.map((t) => t.call_id));

      const removeIndexes = new Set<number>();
      const pendingCallIndexes: number[] = [];

      for (let i = 0; i < history.length; i++) {
        const item = history[i];

        if (item.type === "function_call" && pendingIds.has(item.call_id)) {
          pendingCallIndexes.push(i);
        }

        if (item.type !== "function_call") continue;

        const keep = callOutputIds.has(item.call_id) || approvedIds.has(item.call_id);
        if (keep) continue;

        removeIndexes.add(i);
      }

      const batchStart = pendingCallIndexes[0];

      if (approvedIds.size === 0 && batchStart != null) {
        const prev = history[batchStart - 1];
        if (prev?.type === "reasoning") {
          removeIndexes.add(batchStart - 1);
        }
      }

      history = history.filter((_, index) => !removeIndexes.has(index));

      return streamSSE(async (s) => {
        const writeSSE = createSSEWriter(s)

        if (approvedTools.length > 0) {
          for (const tool of approvedTools) {
            const args = CodeGenSchema.parse(
              JSON.parse(tool.arguments ?? "{}")
            )

            const { stdout } = await executeCode(
              args.code,
              undefined,
              body.skills ?? [],
              writeSSE
            )

            const toolMsg: ResponseInputItem.FunctionCallOutput = {
              type: "function_call_output",
              call_id: tool.call_id,
              output: stdout
            }

            await writeSSE({
              event: 'tool_result',
              data: {
                toolRound: 1,
                callId: tool.call_id,
                name: tool.name,
                outputPreview: stdout.slice(0, 2000)
              }
            })

            history.push(toolMsg)
          }
        }

        await checkpointer.save({ messages: history })
      })
    },
    {
      body: z.object({
        toolCallIds: z.array(z.string()),
        skills: z.array(z.string()),
      })
    }
  )
  .post(
    "/runs/:runId/stop",
    async ({ params: { runId } }) => {
      const controller = runs.get(runId);

      if (controller) {
        controller.abort();

        return streamSSE(async (s) => {
          const writeAgentSSE = createSSEWriter(s);

          await writeAgentSSE({
            event: "stop",
            data: {
              reason: "live_abort",
            },
          });
        });
      }

      const checkpoint = await checkpointer.load();
      let history = checkpoint?.data.messages ?? [];
      const pendingTools = getPendingToolCalls(history);

      if (pendingTools.length > 0) {
        for (let i = history.length - 1; i >= 0; i--) {
          const item = history[i];

          if ("role" in item && item.role === "user") {
            history = history.slice(0, i);
            break;
          }
        }
        await checkpointer.save({ messages: history });
        return streamSSE(async (s) => {
          const writeAgentSSE = createSSEWriter(s)

          await writeAgentSSE({
            event: 'stop',
            data: {
              reason: 'paused_cleanup'
            }
          })
        })
      }

      return JSON.stringify({ ok: false, error: "Nothing to stop" });
    },
    {
      params: z.object({
        runId: z.string()
      })
    }
  )
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

