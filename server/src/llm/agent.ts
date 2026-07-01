import OpenAI from "openai";
import type {
  FunctionTool,
  ResponseInputItem,
  ResponseFunctionToolCallItem,
} from "openai/resources/responses/responses.js";
import { z } from "zod";
import { executeCode } from "../code/executeCode";
import type { Emit, AgentEvent } from "./types";
import { RuntimeEvent } from "../runtime/events";
import { RuntimeGlobal } from "../runtime/types";
import { buildGlobalsPrompt } from "../runtime/globals";

export const CodeGenSchema = z.object({
  code: z.string()
    .min(1)
    .max(10_000, "Code is too large")
})

export type Config = {
  name?: string,
  messages: ResponseInputItem[],
  model: string
  globals?: RuntimeGlobal[];
  skills?: {
    baseDir: string
    available: {
      name: string,
      description?: string
    }[]
  },
  pause?: boolean,
  opts?: {
    toolRounds?: number
    sandboxTimeout?: number,
    signal?: AbortSignal,
  }
}

function errMsg(e: unknown) {
  return e instanceof Error ? `${e.name}: ${e.message}` : String(e);
}

export async function agent(
  config: Config,
  emit?: Emit<AgentEvent | RuntimeEvent>
): Promise<Config> {
  const { model, pause } = config
  const globals = config.globals ?? [];
  const opts = (config.opts ??= {})
  const {
    toolRounds = 3,
    sandboxTimeout = 10,
    signal
  } = opts

  const safeEmit: Emit<AgentEvent | RuntimeEvent> = emit
    ? async (ev) => {
      if (signal?.aborted && ev.event !== "stop") return;
      await emit(ev);
    }
    : async () => { }

  const throwIfAborted = () => {
    if (signal?.aborted) {
      throw new Error("aborted")
    }
  }

  try {
    if (config.messages.length === 0) throw Error('No messages provided')

    const lastMessage = config.messages.at(-1);

    if (lastMessage && "role" in lastMessage && lastMessage.role === "user") {
      await safeEmit({
        event: "init",
        data: {
          message: "AGENT START",
        },
      });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    let openaiTools: FunctionTool[] = []

    if (globals.length > 0) {
      const runtimeGlobalsPrompt = await buildGlobalsPrompt(globals);

      const names = globals.map((global) => global.name);

      if (new Set(names).size !== names.length) {
        throw new Error(
          `Duplicate runtime globals: ${names.join(", ")}`,
        );
      }

      const runTsTool: FunctionTool = {
        type: "function",
        name: "runTs",
        strict: true,
        description: `
        # Execute TypeScript code in a sandboxed Bun process.
        
        ## Runtime globals:
        ${runtimeGlobalsPrompt}
        
        ## Rules:
        - Output final tool results using console.log(...).
        - Write pure TypeScript.
        `.trim(),
        parameters: z.toJSONSchema(CodeGenSchema),
      };

      openaiTools.push(runTsTool);
    }

    let toolRound = 1

    while (true) {
      throwIfAborted()

      let roundText = ""

      const rspStream = openai.responses.stream(
        {
          model,
          input: config.messages,
          tools: openaiTools,

        },
        {
          signal
        }
      )

      for await (const ev of rspStream) {
        throwIfAborted();

        if (ev.type === "response.output_text.delta") {
          const d = ev.delta
          roundText += d
          await safeEmit({ event: "text_delta", data: { delta: d } })
        }

        if (ev.type === 'response.function_call_arguments.delta') {
          await safeEmit({
            event: 'arguments_delta',
            data: {
              delta: ev.delta,
              toolRound,
              id: ev.item_id
            }
          })
        }

        if (ev.type === 'response.output_item.added') {
          if (ev.item.type === 'function_call') {
            await safeEmit({
              event: 'output_item.added',
              data: {
                name: ev.item.name,
                toolRound,
                id: ev.item.id ?? '',
                callId: ev.item.call_id
              }
            })
          }
        }

        if (ev.type === 'error') {
          await safeEmit({
            event: 'error',
            data: { message: ev.message }
          })
        }
      }

      throwIfAborted();

      const final = await rspStream.finalResponse()

      if (!final.id) {
        await safeEmit({
          event: "error",
          data: { message: "Missing response.completed" }
        })
        return config
      }

      const outputItems = final.output ?? []

      const pendingTools: ResponseFunctionToolCallItem[] = []

      for (const item of outputItems) {

        if (item.type === "function_call") {
          const args = CodeGenSchema.parse(
            JSON.parse(item.arguments ?? "{}")
          )

          const toolCall = {
            id: item.id,
            type: "function_call",
            name: item.name,
            arguments: item.arguments,
            call_id: item.call_id,
            status: "completed",
          } as ResponseFunctionToolCallItem

          config.messages.push(toolCall);

          await safeEmit({
            event: "tool_start",
            data: {
              toolRound,
              callId: item.call_id,
              name: item.name,
              args: JSON.stringify(args),
              argsId: item.id ?? ''
            }
          })

          pendingTools.push(toolCall)
        } else if (item.type === "message" || item.type === "reasoning") {
          config.messages.push(item as ResponseInputItem);
        }
      }

      if (roundText.length > 0) {
        await safeEmit({
          event: "text_end",
          data: {
            responseId: final.id,
            fullText: roundText
          }
        })
      }

      if (pendingTools.length > 0 && pause) {

        await safeEmit({
          event: "pause",
          data: { reason: "tool_calls" }
        })

        return config
      }

      const toolResults: ResponseInputItem.FunctionCallOutput[] = []

      for (const item of pendingTools) {

        if (item.type === "function_call") {
          const args = CodeGenSchema.parse(
            JSON.parse(item.arguments ?? "{}")
          )

          throwIfAborted()

          const { stdout } = await executeCode(
            args.code,
            sandboxTimeout,
            globals,
            async ({ event, data }) => {
              await safeEmit({ event, data })
            },
          )

          const toolMsg: ResponseInputItem.FunctionCallOutput = {
            type: "function_call_output",
            call_id: item.call_id,
            output: stdout
          }

          toolResults.push(toolMsg)
          config.messages.push(toolMsg)

          await safeEmit({
            event: "tool_result",
            data: {
              toolRound,
              callId: item.call_id,
              name: item.name,
              outputPreview: stdout.slice(0, 2000)
            }
          })
        } else {
          config.messages.push(item);
        }
      }

      if (toolResults.length === 0) {
        await safeEmit({ event: "end", data: { message: "AGENT END" } });
        return config;
      }

      if (toolRound > toolRounds) {
        await safeEmit({
          event: "error",
          data: { message: `Tool rounds limit reached (${toolRounds})` }
        });
        return config;
      }

      toolRound++
    }
  } catch (e) {
    console.log("[agent catch]", errMsg(e), "aborted=", signal?.aborted);

    if (signal?.aborted) {
      return config;
    }

    await safeEmit({
      event: "error",
      data: { message: errMsg(e) }
    });

    return config
  }
}