import OpenAI from "openai";
import type {
  FunctionTool,
  ResponseInputItem,
  ResponseFunctionToolCallItem
} from "openai/resources/responses/responses.js";
import { z } from "zod";
import { type SandboxAction, createApi } from "@code/actions";
import { CodeGenSchema } from "@code/schemas";

type AgentEvent =
  | { type: "init"; message: string }
  | { type: "text_delta"; delta: string }
  | { type: "text_end"; responseId: string; fullText: string }
  | { type: "arguments_delta"; toolRound: number; delta: string; id: string }
  | { type: "tool_start"; toolRound: number; callId: string; name: string; args?: string, argsId: string }
  | { type: "tool_result"; toolRound: number; callId: string; name: string; outputPreview?: string }
  | { type: "done"; message: string }
  | { type: "error"; message: string };

type Emit<E> = (ev: E) => void | Promise<void>

export type Config = {
  messages: ResponseInputItem[],
  model: string
  actions?: SandboxAction[]
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
  emit?: Emit<AgentEvent>
): Promise<Config> {
  const { model, actions = [] } = config
  const opts = (config.opts ??= {})
  const {
    toolRounds = 3,
    sandboxTimeout = 10,
    signal
  } = opts

  const safeEmit: Emit<AgentEvent> = emit
    ? async (ev) => {
      if (signal?.aborted) return
      await emit(ev)
    }
    : async () => { }

  const throwIfAborted = () => {
    if (signal?.aborted) {
      throw new Error("aborted")
    }
  }

  try {
    if (config.messages.length === 0) throw Error('No messages provided')

    await safeEmit({ type: "init", message: 'INIT' })

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const { api, executeCode } = createApi(actions)

    const openaiTools: FunctionTool[] = Object.entries(api).map(
      ([name, { template, description }]) => {
        const annotatedSchema = z.object({
          ...CodeGenSchema.shape,
          code: CodeGenSchema.shape.code.describe(
            [template, "NO imports, NO fetch, NO network."].join("\n")
          )
        })

        return {
          type: "function",
          name,
          description: description.trim(),
          parameters: z.toJSONSchema(annotatedSchema),
          strict: true
        }
      }
    )

    let toolRound = 1

    while (true) {
      throwIfAborted()

      let roundText = ""
      const toolResults: ResponseInputItem.FunctionCallOutput[] = []

      const rspStream = openai.responses.stream({
        model,
        input: config.messages,
        tools: openaiTools,
      })

      for await (const ev of rspStream) {
        if (ev.type === "response.output_text.delta") {
          const d = ev.delta
          roundText += d
          await safeEmit({ type: "text_delta", delta: d })
        }

        if (ev.type === 'response.function_call_arguments.delta') {
          await safeEmit({
            type: 'arguments_delta',
            delta: ev.delta,
            toolRound,
            id: ev.item_id
          })
        }

        if (ev.type === 'error') {
          await safeEmit({
            type: 'error',
            message: ev.message
          })
        }
      }

      const final = await rspStream.finalResponse()

      if (!final.id) {
        await safeEmit({
          type: "error",
          message: "Missing response.completed"
        })
        return config
      }

      for (const item of final.output ?? []) {

        if (item.type === "function_call") {
          const args = CodeGenSchema.parse(
            JSON.parse(item.arguments ?? "{}")
          )

          config.messages.push({
            id: item.id,
            type: "function_call",
            name: item.name,
            arguments: item.arguments,
            call_id: item.call_id,
            status: "completed",
          } as ResponseFunctionToolCallItem);

          await safeEmit({
            type: "tool_start",
            toolRound,
            callId: item.call_id,
            name: item.name,
            args: JSON.stringify(args),
            argsId: item.id ?? ''
          })

          throwIfAborted()

          const { stdout } = await executeCode(
            args.code,
            sandboxTimeout,
            item.name
          )

          const toolMsg: ResponseInputItem.FunctionCallOutput = {
            type: "function_call_output",
            call_id: item.call_id,
            output: stdout
          }

          toolResults.push(toolMsg)
          config.messages.push(toolMsg)

          await safeEmit({
            type: "tool_result",
            toolRound,
            callId: item.call_id,
            name: item.name,
            outputPreview: stdout.slice(0, 2000)
          })
        } else {
          config.messages.push(item);
        }
      }

      await safeEmit({
        type: "text_end",
        responseId: final.id,
        fullText: roundText
      })

      if (toolResults.length === 0 || toolRound >= toolRounds) {
        await safeEmit({
          type: "done",
          message: 'END'
        })
        return config
      }

      toolRound++
    }
  } catch (e) {
    await safeEmit({ type: "error", message: errMsg(e) })
    return config
  }
}
