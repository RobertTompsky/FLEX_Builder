import { Hono } from 'hono'
import { cors } from 'hono/cors'
import z from 'zod';
import { MODELS, SKILLS_DIR } from './data';
import { zValidator } from '@hono/zod-validator';
import { createCheckpointer } from './lib/utils/checkpointer';
import { streamSSE } from 'hono/streaming';
import { agent, CodeGenSchema, type AgentEvent, type Emit } from './llm/agent';
import fs from 'fs';
import type {
  ResponseFunctionToolCallItem,
  ResponseInputItem
} from 'openai/resources/responses/responses.js';
import { executeCode } from './code/executeCode';
import path from 'path';
import { getSkillsRegistry } from './lib/utils/getSkillsRegistry';

const app = new Hono()

const checkpointer = createCheckpointer('checkpoints/session228')

type UIMessage = {
  role: "assistant" | "user";
  content: string;
  status?: "in_progress" | "completed" | "incomplete";
};

function getPendingToolCalls(messages: ResponseInputItem[]) {
  const calls: ResponseFunctionToolCallItem[] = []
  const outputs = new Set<string>()

  for (const m of messages) {
    if (m.type === "function_call") {
      calls.push(m as ResponseFunctionToolCallItem)
    }
    if (m.type === "function_call_output") {
      outputs.add(m.call_id)
    }
  }

  return calls.filter(c => !outputs.has(c.call_id))
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
      query: z.string().optional(),
      model: z.string(),
      prompt: z.string().optional(),
      toolRounds: z.number().optional(),
      skills: z.array(z.string()).optional(),
      pause: z.boolean().optional(),
      toolCallIds: z.array(z.string()).optional(),
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
      console.log(body)

      if (body.query && body.toolCallIds?.length) {
        return c.text('Found both query and toolCallIds in req.body')
      }

      let history = (await checkpointer.load())?.data.messages.filter(
        m => !("role" in m && m.role === "system")
      ) ?? []

      const isResume = Array.isArray(body.toolCallIds)

      const pendingTools = getPendingToolCalls(history)

      const approvedTools = pendingTools.filter(t => body.toolCallIds?.includes(t.call_id))

      if (approvedTools.length !== pendingTools.length) {
        const approvedIds = new Set(approvedTools.map((t) => t.call_id));
        const outputIds = new Set(
          history
            .filter(
              (m): m is ResponseInputItem.FunctionCallOutput =>
                m.type === "function_call_output"
            )
            .map((m) => m.call_id)
        );

        const removeIndexes = new Set<number>();

        for (let i = 0; i < history.length; i++) {
          const item = history[i];

          if (item.type !== "function_call") continue;

          const keep = outputIds.has(item.call_id) || approvedIds.has(item.call_id);
          if (keep) continue;

          removeIndexes.add(i);

          const prev = history[i - 1];
          if (prev?.type === "reasoning") {
            removeIndexes.add(i - 1);
          }
        }

        history = history.filter((_, index) => !removeIndexes.has(index));
      }

      return streamSSE(c, async (s) => {
        const writeAgentSSE: Emit<AgentEvent> = (ev) => {
          s.writeSSE({
            event: ev.type,
            data: JSON.stringify(ev.data)
          })
        }

        if (!isResume) {
          writeAgentSSE({
            type: 'init',
            data: {
              runId,
              message: 'INIT'
            }
          })
        }

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

            s.writeSSE({
              event: 'tool_result',
              data: JSON.stringify({
                toolRound: 1,
                callId: tool.call_id,
                name: tool.name,
                outputPreview: stdout.slice(0, 2000)
              })
            })

            history.push(toolMsg)
          }
        }

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
          async (ev) => writeAgentSSE(ev)
        )

        await checkpointer.save({
          messages: result.messages,
          runId
        })
      })
    })

export default app
