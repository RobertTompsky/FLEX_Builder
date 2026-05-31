import { Hono } from 'hono'
import { cors } from 'hono/cors'
import z from 'zod';
import { MODELS, SKILLS_DIR } from './data';
import { zValidator } from '@hono/zod-validator';
import { createCheckpointer } from './lib/utils/checkpointer';
import { SSEStreamingApi, streamSSE } from 'hono/streaming';
import { agent, CodeGenSchema } from './llm/agent';
import fs from 'fs';
import type { ResponseInputItem } from 'openai/resources/responses/responses.js';
import { executeCode } from './code/executeCode';
import { getSkillsRegistry } from './lib/utils/getSkillsRegistry';
import { getPendingToolCalls } from './lib/utils/getPendingTools';
import type { Emit, AgentEvent } from './llm/types';

const app = new Hono()

const checkpointer = createCheckpointer('checkpoints/session228')

const runs = new Map<string, AbortController>();

type UIMessage = {
  role: "assistant" | "user";
  content: string;
  status?: "in_progress" | "completed" | "incomplete";
};

function createWriteAgentSSE(s: SSEStreamingApi): Emit<AgentEvent> {
  return async (ev) => {
    await s.writeSSE({
      event: ev.type,
      data: JSON.stringify(ev.data),
    });
  };
}

app
  .use('/*', cors())
  .get('/', (c) => {
    return c.text('Hello Hono!')
  })
  .get('/info', async (c) => {
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

    return c.json({
      skills,
      models: MODELS,
      uiHistory
    })
  })
  .get('/clearHistory', async (c) => {
    await checkpointer.clear()
    return c.json({ ok: true })
  })
  .post(
    '/mcp/:runId',
    zValidator('json', z.object({
      query: z.string().nullable(),
      model: z.string(),
      prompt: z.string().optional(),
      toolRounds: z.number().optional(),
      skills: z.array(z.string()).optional(),
      pause: z.boolean().optional(),
    }),
      (result, c) => {
        if (!result.success) {
          return c.json(
            {
              error: "Validation failed",
              details: result.error,
            },
            400
          );
        }
      }),
    async (c) => {
      const ac = new AbortController()
      c.req.raw.signal.addEventListener("abort", () => ac.abort(), { once: true })
      const body = c.req.valid('json')
      const { runId } = c.req.param()
      runs.set(runId, ac);

      let history = (await checkpointer.load())?.data.messages.filter(
        m => !("role" in m && m.role === "system")
      ) ?? []

      const isResume = body.query === null;

      return streamSSE(c, async (s) => {
        const writeAgentSSE = createWriteAgentSSE(s)

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
            async (ev) => await writeAgentSSE(ev)
          )

          if (!ac.signal.aborted) {
            await checkpointer.save({ messages: result.messages })
          }
        } finally {
          runs.delete(runId);
        }
      })
    })
  .post('/handleToolcalls',
    zValidator('json',
      z.object({
        toolCallIds: z.array(z.string()),
        skills: z.array(z.string()),
      }),
      (result, c) => {
        if (!result.success) {
          return c.json(
            {
              error: "Validation failed",
              details: result.error,
            },
            400
          );
        }
      }),
    async (c) => {
      const body = c.req.valid('json')

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

      return streamSSE(c, async (s) => {
        const writeAgentSSE = createWriteAgentSSE(s)

        if (approvedTools.length > 0) {
          for (const tool of approvedTools) {
            const args = CodeGenSchema.parse(
              JSON.parse(tool.arguments ?? "{}")
            )

            const { stdout } = await executeCode(
              args.code,
              undefined,
              body.skills ?? []
            )

            const toolMsg: ResponseInputItem.FunctionCallOutput = {
              type: "function_call_output",
              call_id: tool.call_id,
              output: stdout
            }

            await writeAgentSSE({
              type: 'tool_result',
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
    })
  .post("/runs/:runId/stop", async (c) => {
    const runId = c.req.param("runId");
    const controller = runs.get(runId);

    if (controller) {
      controller.abort();

      return streamSSE(c, async (s) => {
        const writeAgentSSE = createWriteAgentSSE(s);

        await writeAgentSSE({
          type: "stop",
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
      return streamSSE(c, async (s) => {
        const writeAgentSSE = createWriteAgentSSE(s)

        await writeAgentSSE({
          type: 'stop',
          data: {
            reason: 'paused_cleanup'
          }
        })
      })
    }

    return c.json({ ok: false, error: "Nothing to stop" }, 404);
  })

export default app
