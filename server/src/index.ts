import { Hono } from 'hono'
import { cors } from 'hono/cors'
import z from 'zod';
import { MODELS, SKILLS_DIR } from './data';
import { zValidator } from '@hono/zod-validator';
import { createCheckpointer } from './lib/utils/checkpointer';
import { streamSSE } from 'hono/streaming';
import { agent } from './llm/agent';
import fs from 'fs';
import type { ResponseInputItem } from 'openai/resources/responses/responses.js';

const app = new Hono()

const checkpointer = createCheckpointer('checkpoints/session228')

type UIMessage = {
  role: "assistant" | "user";
  content: string;
  status?: "in_progress" | "completed" | "incomplete";
};

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

    const history = (await checkpointer.load())?.messages ?? []

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
    '/mcp',
    zValidator('json', z.object({
      query: z.string().nullable(),
      model: z.string(),
      prompt: z.string().optional(),
      toolRounds: z.number().optional(),
      skills: z.array(z.string()).optional(),
    })),
    async (c) => {
      const ac = new AbortController()
      c.req.raw.signal.addEventListener("abort", () => ac.abort(), { once: true })
      const body = c.req.valid('json')
      console.log(body)

      let history = (await checkpointer.load())?.messages ?? []

      return streamSSE(c, async (s) => {
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
                  "Consider having all needed functions in the skills directory. You can use them directly by imports."
                ].join('\n'),
                status: 'completed'
              },
              {
                role: "user",
                content: body.query!,
                status: 'completed'
              }
            ],
            skills: {
              baseDir: SKILLS_DIR,
              allowed: body.skills ?? []
            },
            opts: {
              toolRounds: body.toolRounds,
              signal: ac.signal
            }
          },
          async (ev) => {
            s.writeSSE({
              event: ev.type,
              data: JSON.stringify(ev.data)
            })
          }
        )

        history = result.messages.filter(
          m => !("role" in m && m.role === "system")
        )
        await checkpointer.save(history)
      })
    })

export default app
