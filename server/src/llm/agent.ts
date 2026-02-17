import OpenAI from "openai";
import type {
  FunctionTool,
  ResponseInputItem,
  ResponseFunctionToolCallItem
} from "openai/resources/responses/responses.js";
import { z } from "zod";
import fs from "fs";
import { executeCode } from "../code/executeCode";
import { readDirTree } from "../lib/utils/readDirTree";
import path from "path";
import { SKILLS_DIR, SRC_DIR } from "../data";

export const CodeGenSchema = z.object({
  code: z.string()
    .min(1)
    .max(10_000, "Code is too large")
})

type AgentEvent =
  | { type: "init"; data: { message: string } }
  | { type: "text_delta"; data: { delta: string } }
  | { type: "text_end"; data: { responseId: string; fullText: string } }
  | { type: "output_item.added"; data: { toolRound: number; id: string; callId: string; name: string } }
  | { type: "arguments_delta"; data: { toolRound: number; delta: string; id: string } }
  | { type: "tool_start"; data: { toolRound: number; callId: string; name: string; args?: string; argsId: string } }
  | { type: "tool_result"; data: { toolRound: number; callId: string; name: string; outputPreview?: string } }
  | { type: "done"; data: { message: string } }
  | { type: "error"; data: { message: string } };

type Emit<E> = (ev: E) => void | Promise<void>

export type Config = {
  messages: ResponseInputItem[],
  model: string
  skills?: {
    baseDir: string
    allowed: string[]
  },
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
  const { model, skills } = config
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

    await safeEmit({ type: "init", data: { message: "INIT" } })

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    let openaiTools: FunctionTool[] = []

    if (skills) {
      if (!fs.existsSync(skills.baseDir)) {
        throw new Error(`skills.basePath not found: ${skills.baseDir}`);
      }

      const entries = fs
        .readdirSync(skills.baseDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

      const allSkills = new Set(entries);
      const allowedSkills = [...new Set(skills.allowed.map((s) => s.trim()).filter(Boolean))];
      const unknownSkills = allowedSkills.filter((name) => !allSkills.has(name));

      if (unknownSkills.length > 0) {
        throw new Error(`Unknown skills requested: ${unknownSkills.join(", ")}`);
      }

      if (allowedSkills.length > 0) {
        const skillsTree = allowedSkills
          .map(name => readDirTree(path.join(skills.baseDir, name)))
          .join("");
        
        const skillsDirName = path.relative(SRC_DIR, SKILLS_DIR)

        const runTsTool: FunctionTool = {
          type: "function",
          name: "runTs",
          strict: true,
          description: `
          Execute TypeScript code in a sandboxed Bun process.
          Working directory is the project root. The "${skillsDirName}" directory contains available skill functions for handling user tasks.
          
          Structure of the skills directory:         
          ${skillsTree}
          
          Rules:
          - Before calling a skill function, read its source file to understand the input schema:
          - Import skill functions with relative paths, WITHOUT file extensions:
          - Always use "./${skillsDirName}/..." as the base path for both imports and file reads.
          - Output results using console.log(...)
          - Network access is allowed ONLY via provided skills.
          - Do NOT use fetch, axios, or external imports.
          - Do NOT add file extensions (.ts, .js) to imports.
          - Write pure TypeScript.
          `.trim(),
          parameters: z.toJSONSchema(CodeGenSchema),
        };

        openaiTools.push(runTsTool);
      }
    }


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
          await safeEmit({ type: "text_delta", data: { delta: d } })
        }

        if (ev.type === 'response.function_call_arguments.delta') {
          await safeEmit({
            type: 'arguments_delta',
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
              type: 'output_item.added',
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
            type: 'error',
            data: { message: ev.message }
          })
        }
      }

      const final = await rspStream.finalResponse()

      if (!final.id) {
        await safeEmit({
          type: "error",
          data: { message: "Missing response.completed" }
        })
        return config
      }

      const outputItems = final.output ?? []

      for (const item of outputItems) {

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
            data: {
              toolRound,
              callId: item.call_id,
              name: item.name,
              args: JSON.stringify(args),
              argsId: item.id ?? ''
            }
          })

          throwIfAborted()

          const { stdout } = await executeCode(
            args.code,
            sandboxTimeout,
            skills?.allowed ?? []
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

      await safeEmit({
        type: "text_end",
        data: {
          responseId: final.id,
          fullText: roundText
        }
      })

      if (toolResults.length === 0) {
        await safeEmit({ type: "done", data: { message: "END" } });
        return config;
      }

      if (toolRound > toolRounds) {
        await safeEmit({
          type: "error",
          data: { message: `Tool rounds limit reached (${toolRounds})` }
        });
        return config;
      }

      toolRound++
    }
  } catch (e) {
    await safeEmit({ type: "error", data: { message: errMsg(e) } })
    return config
  }
}
