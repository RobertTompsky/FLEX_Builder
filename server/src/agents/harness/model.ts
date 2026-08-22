import OpenAI from "openai";

import type {
    FunctionTool,
    ResponseInputItem,
} from "openai/resources/responses/responses.js";
import { toResponseInputItems } from 'openai/lib/responses/ResponseInputItems';

import { createAgentEmitter, Emit } from "../../sse";
import {
    type AgentIdentity,
    type AgentEvent,
    type AgentSSEMessage,
    toAgentSSEMessage
} from "@flex-builder/shared/agent";
import { CodeGenSchema } from "@flex-builder/shared/capabilities";

export type ModelConfig = {
    model: string;
    messages: ResponseInputItem[];
    tools: FunctionTool[];
    signal?: AbortSignal;
};

export type ModelStepResult = {
    status: "completed" | "tool_calls";
    responseId: string;
    output: ResponseInputItem[];
};

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function model(
    config: ModelConfig,
    identity: AgentIdentity,
    emit?: Emit<AgentSSEMessage>,
): Promise<ModelStepResult> {
    const {
        model,
        messages,
        tools,
        signal,
    } = config;

    const safeEmit =
        createAgentEmitter<AgentEvent>(
            identity,
            emit,
            signal,
        );

    throwIfAborted(signal);

    if (config.messages.length === 0) {
        throw new Error("No messages provided");
    }

    let turnText = "";

    // console.log(config.messages)

    const responseStream =
        openai.responses.stream(
            {
                model: config.model,
                input: config.messages,
                tools,
                reasoning: {
                    effort: 'none'
                }
            },
            {
                signal,
            },
        );

    for await (const event of responseStream) {
        throwIfAborted(signal);

        switch (event.type) {
            case "response.output_text.delta": {
                turnText += event.delta;

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

    const response = await responseStream.finalResponse();

    if (!response.id) {
        throw new Error(
            "Missing response.completed",
        );
    }

    //приходится вручную убирать parsed_arguments, видимо helper еще не обновили под новую версию SDK
    const output = [
        ...toResponseInputItems(
            response.output ?? [],
        ),
    ].map((item): ResponseInputItem => {
        if (item.type !== "function_call") {
            return item;
        }

        const {
            parsed_arguments: _,
            ...functionCall
        } = item as typeof item & {
            parsed_arguments?: unknown;
        };

        return functionCall;
    });

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

    if (turnText.length > 0) {
        await safeEmit({
            event: "text_end",
            data: {
                responseId: response.id,
                fullText: turnText,
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

function throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
        throw new Error("aborted");
    }
}