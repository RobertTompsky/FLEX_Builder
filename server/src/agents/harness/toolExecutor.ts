import type {
    ResponseFunctionToolCallItem,
    ResponseInputItem,
} from "openai/resources/responses/responses.js";
import { executeCode } from "../../runtime/code/executeCode";
import { createAgentEmitter, Emit } from "../../sse";
import { AgentRuntimeContext, SandboxRuntimeConfig } from "../../runtime/types";
import { AgentIdentity, AgentSourceEvent, AgentSSEMessage } from "@flex-builder/shared/agent";
import { CodeGenSchema } from "@flex-builder/shared/capabilities";

export type ToolExecutorConfig = {
    toolCalls: ResponseFunctionToolCallItem[];
    capabilityIds: string[];
    context: AgentRuntimeContext;
    sandboxTimeout?: number;
    signal?: AbortSignal;
};

export type ToolExecutorResult = {
    output: ResponseInputItem.FunctionCallOutput[];
};

export async function toolExecutor(
    config: ToolExecutorConfig,
    identity: AgentIdentity,
    emit?: Emit<AgentSSEMessage>,
): Promise<ToolExecutorResult> {
    const {
        capabilityIds,
        toolCalls,
        context,
        sandboxTimeout = 10,
        signal,
    } = config;

    const output: ResponseInputItem.FunctionCallOutput[] = [];

    const safeEmit = createAgentEmitter<AgentSourceEvent>(
        identity,
        emit,
        signal,
    );

    for (const toolCall of toolCalls) {
        throwIfAborted(signal);

        const args = CodeGenSchema.parse(
            JSON.parse(
                toolCall.arguments ?? "{}",
            ),
        );

        const runtimeConfig:
            SandboxRuntimeConfig = {
            capabilityIds,
            context: {
                ...context,
                toolCallId: toolCall.call_id,
            },
        };

        const { stdout, } = await executeCode({
            code: args.code,
            timeoutSeconds: sandboxTimeout,
            runtimeConfig,
            onRuntimeEvent: async (runtimeEvent) => {
                await safeEmit(runtimeEvent);
            },
        });

        const result: ResponseInputItem.FunctionCallOutput = {
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