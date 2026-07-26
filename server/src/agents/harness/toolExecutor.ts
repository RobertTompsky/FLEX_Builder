import type {
    ResponseFunctionToolCallItem,
    ResponseInputItem,
} from "openai/resources/responses/responses.js";

import { executeCode } from "../../code/executeCode";

import type {
    RuntimeGlobal,
} from "../../runtime/globals/types";

import { Emit } from "../../shared/utils/streamSSE";
import { AgentIdentity, CodeGenSchema } from "../shared/schemas";
import { ArtifactEvent } from "../../runtime/globals/artifact/events";
import { AgentEnvelopeEvent, AgentEvent } from "../events";

export type ToolExecutorConfig = {
    toolCalls: ResponseFunctionToolCallItem[];
    globals?: RuntimeGlobal[];
    sandboxTimeout?: number;
    signal?: AbortSignal;
};

export type ToolExecutorResult = {
    output: ResponseInputItem.FunctionCallOutput[];
};

export async function toolExecutor(
    config: ToolExecutorConfig,
    identity: AgentIdentity,
    emit?: Emit<AgentEnvelopeEvent>,
): Promise<ToolExecutorResult> {
    const {
        toolCalls,
        globals = [],
        sandboxTimeout = 10,
        signal,
    } = config;

    const output:
        ResponseInputItem.FunctionCallOutput[] =
        [];

    const safeEmit: Emit<
        AgentEvent | ArtifactEvent
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

    for (const toolCall of toolCalls) {
        throwIfAborted(signal);

        const args = CodeGenSchema.parse(
            JSON.parse(
                toolCall.arguments ?? "{}",
            ),
        );

        const { stdout } = await executeCode(
            args.code,
            sandboxTimeout,
            globals,
            async (runtimeEvent) => {
                if (
                    runtimeEvent.event ===
                    "agent_event"
                ) {
                    /*
                     * Событие вложенного агента уже содержит
                     * его собственную identity-envelope.
                     */
                    await emit?.(
                        runtimeEvent.data,
                    );

                    return;
                }

                await safeEmit(runtimeEvent);
            },
        );

        const result:
            ResponseInputItem.FunctionCallOutput =
        {
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: stdout,
        };

        output.push(result);

        await safeEmit({
            event: "tool_result",
            data: {
                callId: toolCall.call_id,
                name: toolCall.name,
                outputPreview:
                    stdout.slice(0, 2000),
            },
        });
    }

    return {
        output,
    };
}

function throwIfAborted(
    signal?: AbortSignal,
): void {
    if (signal?.aborted) {
        throw new Error("aborted");
    }
}