import { LlmConfig, LlmStepResult } from "./types";
import { CodeGenSchema } from "@flex-builder/shared/capabilities";
import { ResponseInputItem } from "openai/resources/responses/responses.js";
import { toResponseInputItems } from "openai/lib/responses/ResponseInputItems.js";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function model({
    model,
    messages,
    tools,
    reasoning,
    signal,
    onEvent,
}: LlmConfig): Promise<LlmStepResult> {
    throwIfAborted(signal);

    if (messages.length === 0) {
        throw new Error(
            "No messages provided",
        );
    }

    let turnText = "";

    const responseStream = openai.responses.stream(
        {
            model,
            input: messages,
            tools,
            reasoning,
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

                await onEvent?.({
                    event: "text_delta",
                    data: {
                        delta: event.delta,
                    },
                });

                break;
            }

            case "response.function_call_arguments.delta": {
                await onEvent?.({
                    event: "arguments_delta",
                    data: {
                        delta: event.delta,
                        id: event.item_id,
                    },
                });

                break;
            }

            case "response.output_item.added": {
                if (event.item.type !== "function_call") {
                    break;
                }

                await onEvent?.({
                    event: "output_item.added",
                    data: {
                        name: event.item.name,
                        id: event.item.id ?? "",
                        callId: event.item.call_id,
                    },
                });

                break;
            }

            case "error": {
                await onEvent?.({
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

    /*
     * SDK helper currently may preserve
     * parsed_arguments on function_call
     * items, while ResponseInputItem
     * doesn't expect it.
     */
    const output = [
        ...toResponseInputItems(
            response.output ??
            [],
        ),
    ].map((item): ResponseInputItem => {
        if (
            item.type !==
            "function_call"
        ) {
            return item;
        }

        const {
            parsed_arguments:
            _,
            ...functionCall
        } =
            item as
            typeof item & {
                parsed_arguments?:
                unknown;
            };

        return functionCall;
    });

    const hasToolCalls = output.some(
        (item) =>
            item.type ===
            "function_call",
    );

    for (const item of output) {
        if (item.type !== "function_call") {
            continue;
        }

        if (!item.id) {
            throw new Error(
                `Function call "${item.name}" is missing an id`,
            );
        }

        const args = CodeGenSchema.parse(
            JSON.parse(
                item.arguments ??
                "{}",
            ),
        );

        await onEvent?.({
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
        await onEvent?.({
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
        throw new Error(
            "aborted",
        );
    }
}