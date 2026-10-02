import { Elysia } from "elysia";
import 'dotenv'
import z from "zod";
import fs from 'fs-extra'
import {
  ALLOWED_FILE_EXTENSIONS,
  UPLOADS_DIR,
} from "./shared/data";
import path from 'path'
import { cors } from '@elysia/cors'
import { createWorkspaceStore } from "./services/workspace/store";
import {
  agentsRoutes,
  chatRoutes,
  metadataRoutes
} from "./routes";
import { createRunRegistry } from "./services/runs/runs";
import { chatRepository } from "./db/chats";
import { agentRepository } from "./db/agents"
import { capabilityRepository } from "./db/capabilities";
import { AGENT_WORKSPACES_DIR } from "./services/workspace";
import { SandboxService } from "./services/sandbox/service";
import { createSandboxTransport } from "./services/sandbox/transport";
import { ExecutionService } from "./services/execute";
import { runRepository } from "./db/runs";
import { CAPABILITY_DEFINITIONS } from "./capabilities";

const transport = createSandboxTransport();

const sandboxService = new SandboxService();

const executionService = new ExecutionService();

await Promise.all([
  sandboxService.connect(transport),
  executionService.connect(transport),
]);
console.log('[capabilities]: service started')

const workspaceStore = createWorkspaceStore(AGENT_WORKSPACES_DIR);

const runRegistry = createRunRegistry();

const fileSchema = z.file().refine((file: File) => {
  const ext = path.extname(file.name).toLowerCase()
  return ALLOWED_FILE_EXTENSIONS.has(ext)
}, {
  error: 'Only text/code files are allowed',
})

const app = new Elysia()
  .use(cors())
  .get("/", () => "Марс вечен")
  .use(agentsRoutes({
    workspaceStore,
    runRegistry,
    runRepository,
    agentRepository,
    capabilityRepository,
    chatRepository,
    sandboxService,
    executionService
  }))

  .use(chatRoutes({
    chatRepository,
    runRepository,
    workspaceStore
  }))

  .use(metadataRoutes())

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
          message: error instanceof Error
            ? error.message
            : String(error),
        }
      }
    },
    {
      body: z.object({
        files: z.union([fileSchema, z.array(fileSchema)]),
      }),
    },
  )

  .get('jev', async ({ set }) => {

    const TYPESAFE_API_URL =
      "https://api.typesafe.ai/v1/systemone";

    const TEST_CASES = [
      {
        id: "crypto-news",
        prompt:
          "Find the current Bitcoin price and explain whether recent news could be affecting it.",
      },

      {
        id: "website-research",
        prompt:
          "Open the TypeSafe AI website, inspect the documentation and summarize how Jev works.",
      },

      {
        id: "crypto-comparison",
        prompt:
          "Compare the current prices of Bitcoin and Ethereum, then search for recent market news that might explain their movement.",
      },

      {
        id: "research-report",
        prompt:
          "Research recent developments in AI agents and create a short report with the findings.",
      },

      {
        id: "browser-download",
        prompt:
          "Find the latest TypeSafe AI documentation, open the relevant page and download any useful document if available.",
      },
    ];

    const capabilityCriteria =
      Object.fromEntries(
        CAPABILITY_DEFINITIONS.map(
          ({
            id,
            description,
          }) => [
              id,
              description,
            ],
        ),
      );

    type JevChoiceAnswer = {
      type: "choice";

      choice:
      string;

      probabilities:
      Record<string, number>;

      confidence:
      number;
    };

    type JevResponse = {
      model:
      string;

      answers:
      Record<
        string,
        JevChoiceAnswer
      >;

      usage: {
        input_tokens:
        number;

        output_tokens:
        number;
      };
    };

    const apiKey =
      process.env.JEV_API_KEY;

    if (!apiKey) {
      set.status = 500;

      return {
        ok: false,

        error:
          "TYPESAFE_API_KEY is not configured",
      };
    }

    const results =
      await Promise.all(
        TEST_CASES.map(
          async ({
            id,
            prompt,
          }) => {
            const startedAt =
              performance.now();

            const response =
              await fetch(
                TYPESAFE_API_URL,
                {
                  method:
                    "POST",

                  headers: {
                    Authorization:
                      `Bearer ${apiKey}`,

                    "Content-Type":
                      "application/json",
                  },

                  body:
                    JSON.stringify({
                      model:
                        "jev-latest",

                      state: {
                        userRequest:
                          prompt,
                      },

                      questions: {
                        capability: {
                          type:
                            "choice",

                          instructions:
                            `
Choose the capability that should be used FIRST
to make progress on the user's request.

The request may eventually require multiple capabilities.
Do not try to solve the whole task.

Choose only the most appropriate next capability.
                                `.trim(),

                          criteria:
                            capabilityCriteria,
                        },
                      },
                    }),
                },
              );

            const latencyMs =
              Math.round(
                performance.now()
                - startedAt,
              );

            if (!response.ok) {
              return {
                id,
                prompt,

                ok: false as const,

                status:
                  response.status,

                error:
                  await response.text(),

                latencyMs,
              };
            }

            const data =
              await response
                .json() as JevResponse;

            const answer =
              data
                .answers
                .capability;

            return {
              id,
              prompt,

              ok: true as const,

              choice:
                answer.choice,

              confidence:
                answer.confidence,

              probabilities:
                answer.probabilities,

              model:
                data.model,

              usage:
                data.usage,

              latencyMs,
            };
          },
        ),
      );

    const successful =
      results.filter(
        (
          result,
        ): result is Extract<
          typeof result,
          {
            ok: true;
          }
        > =>
          result.ok,
      );


    return {
      ok: true,

      capabilities:
        capabilityCriteria,

      results,

      totals: {
        requests:
          results.length,

        inputTokens:
          successful.reduce(
            (
              total,
              result,
            ) =>
              total
              + result
                .usage
                .input_tokens,
            0,
          ),

        outputTokens:
          successful.reduce(
            (
              total,
              result,
            ) =>
              total
              + result
                .usage
                .output_tokens,
            0,
          ),
      },
    };
  })
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

let shuttingDown = false;

async function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  await Promise.allSettled([
    executionService.close(),
    sandboxService.close(),
  ]);

  await transport.close();

  process.exit(exitCode);
}

process.once(
  "SIGINT",
  () => {
    void shutdown(130);
  },
);

process.once(
  "SIGTERM",
  () => {
    void shutdown(143);
  },
);