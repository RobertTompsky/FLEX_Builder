import OpenAI from "openai";
import type {
  FunctionTool,
  ResponseInputItem,
  ResponseFunctionToolCallItem,
} from "openai/resources/responses/responses.js";
import { z } from "zod";
import fs from "fs";
import { executeCode } from "../code/executeCode";
import { readDirTree } from "../lib/utils/readDirTree";
import path from "path";
import { SKILLS_DIR, SRC_DIR } from "../data";
import type { Emit, AgentEvent } from "./types";
import { RuntimeEvent } from "../runtime/events";

export const CodeGenSchema = z.object({
  code: z.string()
    .min(1)
    .max(10_000, "Code is too large")
})

export type Config = {
  name?: string,
  messages: ResponseInputItem[],
  model: string
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
  const { model, skills, pause } = config
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

    if (skills) {
      if (!fs.existsSync(skills.baseDir)) {
        throw new Error(`skills.basePath not found: ${skills.baseDir}`);
      }

      const entries = fs
        .readdirSync(skills.baseDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

      const allSkills = new Set(entries);
      const allowedSkills = [...new Set(skills.available.map((s) => s.name.trim()).filter(Boolean))];
      const unknownSkills = allowedSkills.filter((name) => !allSkills.has(name));

      if (unknownSkills.length > 0) {
        throw new Error(`Unknown skills requested: ${unknownSkills.join(", ")}`);
      }

      if (allowedSkills.length > 0) {
        const skillsTree = allowedSkills
          .map((name) => {
            const tree = readDirTree(path.join(skills.baseDir, name));
            const desc = skills.available.find((s) => s.name === name)?.description?.trim();

            return [
              `Skill name: ${name}`,
              `Skill description: ${desc || "No description provided."}`,
              `Skill file tree:`,
              "```text",
              tree,
              "```",
            ].join("\n");
          })
          .join("\n\n");

        const skillsDirName = path.relative(SRC_DIR, SKILLS_DIR);

        const runTsTool: FunctionTool = {
          type: "function",
          name: "runTs",
          strict: true,
          description: `
          Execute TypeScript code in a sandboxed Bun process.
          Working directory is the project src directory.
          
          Runtime globals:
          - artifact(input) is available globally. Do NOT import it.
          - Use artifact(...) for ALL filesystem operations: reading files and creating files.
          - Do NOT use fs, Bun.write, writeFile, readFile, or any other direct filesystem API.
          
          Path rules:
          - Use virtual runtime paths.
          - Do NOT use absolute paths.
          - Do NOT use ".." path segments.
          - To read a skill file, use:
            "skills/<skill-name>/<file-name>.ts"
          
          - To read an uploaded user file, use:
            "uploads/<file-name>"
          
          - To read or create an artifact, use a path relative to the artifacts directory:
            "summary.md"
            "reports/analysis.md"
            "tasks/todo.json"
          
          artifact(...) examples:
          
          Read a skill source file:
          artifact({
            type: "read",
            filePath: "skills/example/index.ts",
            report: "Read skill source to understand its input schema"
          })
          
          Read an uploaded file:
          artifact({
            type: "read",
            filePath: "uploads/README.md",
            report: "Read uploaded README file"
          })
          
          Create an artifact:
          artifact({
            type: "create",
            filePath: "summary.md",
            content: "# Summary\\n...",
            description: "Summary generated from uploaded files",
            report: "Created summary artifact"
          })
          
          Skills:
          All available skills are located inside the "skills" directory.
          Each subdirectory inside this directory represents one skill.
          A skill may contain one or more TypeScript files.
          
          Available skills:
          ${skillsTree}
          
          Rules:
          - Before calling a skill function for the first time, ALWAYS read its source file using artifact({ type: "read", ... }) to understand the input schema.
          - Import skill functions with relative paths, WITHOUT file extensions.
          - Always use "./${skillsDirName}/..." as the base path for imports.
          - Always use "skills/..." as the base path for reading skill files with artifact(...).
          - Network access is allowed ONLY via provided skills.
          - Do NOT use fetch, axios, or external imports.
          - Do NOT use direct filesystem APIs.
          - Output final tool results using console.log(...).
          - Write pure TypeScript.
          `.trim(),
          parameters: z.toJSONSchema(CodeGenSchema),
        };

        // const runTsTool: FunctionTool = {
        //   type: "function",
        //   name: "runTs",
        //   strict: true,
        //   description: `
        //   Execute TypeScript code in a sandboxed Bun process.
        //   Working directory is the project root. 

        //   All available skills are located inside the "${skillsDirName}" directory.
        //   Each subdirectory inside this directory represents one skill.
        //   A skill may contain one or more TypeScript files that you can read and import

        //   Each skill block below contains:
        //   - skill name
        //   - optional description
        //   - file tree

        //   Available skills:
        //   ${skillsTree}

        //   Rules:
        //   - Before calling a skill function for the first time, *ALWAYS* read its source file to understand the input schema:
        //   - Import skill functions with relative paths, WITHOUT file extensions:
        //   - Always use "./${skillsDirName}/..." as the base path for both imports and file reads.
        //   - Output results using console.log(...)
        //   - Network access is allowed ONLY via provided skills.
        //   - Do NOT use fetch, axios, or external imports.
        //   - Do NOT add file extensions (.ts, .js) to imports.
        //   - Write pure TypeScript.
        //   `.trim(),
        //   parameters: z.toJSONSchema(CodeGenSchema),
        // };

        openaiTools.push(runTsTool);
      }
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
            skills?.available.map(s => s.name) ?? [],
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
      // console.log("[agent stop emit] start");
      // if (emit) {
      //   await emit({
      //     type: "stop",
      //     data: { reason: "aborted" }
      //   });
      // }
      // console.log("[agent stop emit] done");
      return config;
    }

    await safeEmit({
      event: "error",
      data: { message: errMsg(e) }
    });

    return config
  }
}