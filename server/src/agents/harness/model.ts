import OpenAI from "openai";

import type {
    FunctionTool,
    ResponseInputItem,
} from "openai/resources/responses/responses.js";
import { toResponseInputItems } from 'openai/lib/responses/ResponseInputItems';

import { z } from "zod";

import type {
    AgentEvent,
    AgentStreamEvent,
    ArtifactRuntimeEvent,
} from "../../events";

import {
    CodeGenSchema,
    type AgentIdentity,
    type AgentRunConfig,
} from "../shared/schemas";

import {
    buildGlobalsPrompt,
} from "../../runtime/globals";

import { Emit } from "../../shared/utils/streamSSE";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export type ModelStepResult = {
    status: "completed" | "tool_calls";
    responseId: string;
    output: ResponseInputItem[];
};

export async function model(
    config: AgentRunConfig,
    identity: AgentIdentity,
    emit?: Emit<AgentStreamEvent>,
): Promise<ModelStepResult> {
    const globals = config.globals ?? [];
    const signal = config.opts?.signal;

    const safeEmit: Emit<
        AgentEvent | ArtifactRuntimeEvent
    > = emit
            ? async (event) => {
                if (
                    signal?.aborted &&
                    event.event !== "stop"
                ) {
                    return;
                }

                await emit({
                    agent: identity,
                    event,
                });
            }
            : async () => { };

    throwIfAborted(signal);

    if (config.messages.length === 0) {
        throw new Error("No messages provided");
    }

    const tools = await buildOpenAITools(
        globals,
    );

    let roundText = "";

    const responseStream =
        openai.responses.stream(
            {
                model: config.model,
                input: config.messages,
                tools,
            },
            {
                signal,
            },
        );

    for await (const event of responseStream) {
        throwIfAborted(signal);

        switch (event.type) {
            case "response.output_text.delta": {
                roundText += event.delta;

                await safeEmit({
                    event: "text_delta",
                    data: {
                        delta: event.delta,
                    },
                });

                break;
            }

            case "response.function_call_arguments.delta": {
                await safeEmit({
                    event: "arguments_delta",
                    data: {
                        delta: event.delta,
                        id: event.item_id,
                    },
                });

                break;
            }

            case "response.output_item.added": {
                if (
                    event.item.type ===
                    "function_call"
                ) {
                    await safeEmit({
                        event: "output_item.added",
                        data: {
                            name: event.item.name,
                            id: event.item.id ?? "",
                            callId: event.item.call_id,
                        },
                    });
                }

                break;
            }

            case "error": {
                await safeEmit({
                    event: "error",
                    data: {
                        message: event.message,
                    },
                });

                break;
            }
        }
    }

    throwIfAborted(signal);

    const response =
        await responseStream.finalResponse();

    if (!response.id) {
        throw new Error(
            "Missing response.completed",
        );
    }

    const output = [
        ...toResponseInputItems(
            response.output ?? [],
        ),
    ];

    const hasToolCalls = output.some(
        (item) =>
            item.type === "function_call",
    );

    /*
     * Валидация и tool_start относятся к текущему
     * model output, но история здесь не мутируется.
     */
    for (const item of output) {
        if (
            item.type !== "function_call"
        ) {
            continue;
        }

        if (!item.id) {
            throw new Error(
                `Function call "${item.name}" is missing an id`,
            );
        }

        const args = CodeGenSchema.parse(
            JSON.parse(
                item.arguments ?? "{}",
            ),
        );

        await safeEmit({
            event: "tool_call",
            data: {
                callId: item.call_id,
                name: item.name,
                args: JSON.stringify(args),
                argsId: item.id,
            },
        });
    }

    if (roundText.length > 0) {
        await safeEmit({
            event: "text_end",
            data: {
                responseId: response.id,
                fullText: roundText,
            },
        });
    }

    return {
        status: hasToolCalls
            ? "tool_calls"
            : "completed",

        responseId: response.id,
        output,
    };
}

async function buildOpenAITools(
    globals: NonNullable<
        AgentRunConfig["globals"]
    >,
): Promise<FunctionTool[]> {
    if (globals.length === 0) {
        return [];
    }

    const names = globals.map((global) => global.name);

    const duplicateNames = names.filter(
        (name, index) =>
            names.indexOf(name) !== index,
    );

    if (duplicateNames.length > 0) {
        throw new Error(
            `Duplicate runtime globals: ${[...new Set(duplicateNames)].join(", ")
            }`,
        );
    }

    const runtimeGlobalsPrompt = await buildGlobalsPrompt(globals);

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

    return [runTsTool];
}

function throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
        throw new Error("aborted");
    }
}