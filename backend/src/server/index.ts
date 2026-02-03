import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import 'dotenv/config'
import { Client } from '@modelcontextprotocol/sdk/client'
import path from 'path'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { log } from '@utils/logger'
import { agent } from '@llm/agent'
import { def } from '@code/actions'
import z from 'zod'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { zValidator } from '@hono/zod-validator'
import { MODELS, SKILLS } from 'src/data'
import { streamSSE } from 'hono/streaming'
import { createCheckpointer } from '@utils/checkpointer'

const app = new Hono()

const mcpClient = new Client(
  {
    name: 'demo_client',
    version: '2.2.8'
  },
  {}
)

const tsxBin = path.resolve(
  'node_modules/.bin',
  process.platform === 'win32' ? 'tsx.cmd' : 'tsx'
)

const transport = new StdioClientTransport({
  command: tsxBin,
  args: [path.resolve('src/mcp/server.ts')],
  stderr: 'inherit'
})
log.section('MAIN')
log.info("Hono + MCP client started");

try {
  await mcpClient.connect(transport)
} catch (error) {
  log.error('[MCP] failed to connect:', error)
}

const InfoResponseSchema = z.object({
  skills: z.array(z.string()),
  models: z.array(z.string()),
});

app
  .use('/*', cors())
  .get('/', (c) => {
    return c.text('Hello Hono!')
  })
  .get('/info', async (c) => {
    const parsed = InfoResponseSchema.parse({
      skills: SKILLS,
      models: MODELS
    });
    return c.json(parsed)
  })
  .post(
    '/mcp',
    zValidator('json', z.object({
      query: z.string().nullable(),
      model: z.string().min(1),
      prompt: z.string().nullable()
    })),
    async (c) => {
      const checkpointer = createCheckpointer('checkpoints/session228')
      let history = (await checkpointer.load())?.messages ?? []
      const ac = new AbortController()
      c.req.raw.signal.addEventListener("abort", () => ac.abort(), { once: true })

      const body = c.req.valid('json')

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
                  "For all external data you **must** use MCP client inside sandbox to discover tools and call the appropriate one",
                  "Never invent tool names."
                ].join('\n'),
              },
              {
                role: "user",
                content: body.query!
              }
            ],
            actions: [
              {
                name: 'calculate',
                description: 'Write simle func code that calculates numbers.'
              },
              def({
                name: "listMcpTools",
                description: [
                  "Return a list of available tools from MCP server including names, descriptions and input schemas.",
                ].join("\n"),
                call: async () => {
                  const { tools } = await mcpClient.listTools();

                  return JSON.stringify(
                    tools.map(t => ({
                      name: t.name,
                      description: t.description,
                      args: t.inputSchema,
                    })),
                    null,
                    2
                  );
                }
              }),
              def({
                name: "callMcpTool",
                description: [
                  "Call an existing MCP tool by name.",
                  "",
                  "IMPORTANT RULES:",
                  "- You MUST NOT implement your own logic inside code when using this tool.",
                  "- You MUST ONLY call tools that exist on the MCP server.",
                  "- Never invent tool names.",
                ].join("\n"),
                schema: z.object({
                  name: z.string(),
                  args: z.record(z.string(), z.unknown()).optional(),
                }),
                call: async ({ name, args = {} }) => {
                  const out = await mcpClient.callTool({
                    name,
                    arguments: args
                  }) as CallToolResult;

                  const text = out.content
                    .map(el => el.type === "text" ? el.text : JSON.stringify(el))
                    .join("\n")
                    .trim();

                  return text;
                }
              })
            ],
            opts: {
              toolRounds: 3,
              signal: ac.signal
            }
          },
          async (ev) => {
            if (ev.type === 'text_delta' || ev.type === 'arguments_delta') {
              s.writeSSE({
                event: ev.type,
                data: JSON.stringify({
                  delta: ev.delta,
                  ...(ev.type === 'arguments_delta' && { id: ev.id }),
                })
              })
            }

            if (ev.type === 'init') {
              s.writeSSE({
                event: ev.type,
                data: ev.message
              })
            }

            if (ev.type === 'tool_start') {
              s.writeSSE({
                event: ev.type,
                data: JSON.stringify({
                  name: ev.name,
                  callId: ev.callId,
                  args: ev.args ?? '',
                  toolRound: ev.toolRound,
                  argsId: ev.argsId
                })
              })
            }

            if (ev.type === 'tool_result') {
              s.writeSSE({
                event: ev.type,
                data: JSON.stringify({
                  name: ev.name,
                  callId: ev.callId,
                  outputPreview: ev.outputPreview,
                  toolRound: ev.toolRound
                })
              })
            }

            if (ev.type === "done") {
              s.writeSSE({
                event: ev.type,
                data: ev.message
              })
            }

            if (ev.type === 'error') {
              s.writeSSE({
                event: ev.type,
                data: ev.message
              })
            }
          }
        )

        history = result.messages.filter(
          m => !("role" in m && m.role === "system")
        )
        await checkpointer.save(history)
      })
    })

process.once('SIGINT', async () => {
  log.info('Closing MCP client')
  await mcpClient.close()
  await transport.close()
  process.exit(0)
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  log.info(`Server is running on http://localhost:${info.port}`)
})


