import type {
    ResponseFunctionToolCallItem,
    ResponseInputItem,
} from "openai/resources/responses/responses.js";
import {
    model,
} from "./model";
import {
    toolExecutor,
} from "./toolExecutor";
import type {
    AgentHooks,
} from "./hooks/types";
import {
    createPreToolUseContext,
} from "./hooks/preToolUse/hook";
import { createAgentEmitter, type Emit } from "../../sse";
import { buildRunTsTool } from "./tools/runTsTool";
import { CAPABILITIES_DIR, Model } from "../../shared/data";
import { resolveCapabilities } from "../../runtime/execute";
import type { AgentRuntimeContext } from "../../runtime/types";
import {
    type AgentIdentity,
    type AgentEvent,
    type AgentSSEMessage,
    type AgentState,
} from "@flex-builder/shared/agent";
import type { AgentCapabilityConfig } from "@flex-builder/shared/capabilities";
import { getPendingToolCalls } from "../shared";

export type AgentRuntimeConfig = {
    runId: string;
    workspaceRoot: string;
};

export type AgentRunConfig = {
    model: Model;
    state: AgentState<{ messages: ResponseInputItem }>;
    capabilities: AgentCapabilityConfig[];
    runtime: AgentRuntimeConfig;
    hooks?: AgentHooks;
    opts?: {
        maxTurns?: number;
        sandboxTimeout?: number;
        signal?: AbortSignal;
    };
};

export type AgentRunStatus =
    | "completed"
    | "awaiting_tool_approval"
    | "turn_limit";

export type AgentRunResult = {
    status: AgentRunStatus;
    state: AgentState<{ messages: ResponseInputItem }>;
};

export async function agent(
    config: AgentRunConfig,
    identity: AgentIdentity,
    emit?: Emit<AgentSSEMessage>,
): Promise<AgentRunResult> {
    const {
        state,
        capabilities,
        runtime,
        hooks,
        opts,
    } = config;

    const maxTurns = opts?.maxTurns ?? 3;
    const sandboxTimeout = opts?.sandboxTimeout ?? 10;
    const signal = opts?.signal;
    const messages = [...state.messages];
    const activeRequest = state.activeRequest;

    if (!activeRequest) {
        throw new Error(
            "Agent cannot run without an active request",
        );
    }

    const agentContext: AgentRuntimeContext = {
        agentId: identity.id,
        runId: config.runtime.runId,
        requestId: activeRequest.id,
        workspaceRoot: config.runtime.workspaceRoot,
    };

    let turnsUsed = activeRequest.turnsUsed;

    let pendingToolCalls = getPendingToolCalls(messages);

    const emitAgentEvent = createAgentEmitter<AgentEvent>(
        identity,
        emit,
        signal,
    );

    if (pendingToolCalls.length === 0) {
        await emitAgentEvent({
            event: 'init',
            data: {
                runId: runtime.runId,
                message: 'Agent started'
            }
        })
    }

    throwIfAborted(signal);

    const resolvedCapabilities = await resolveCapabilities(
        CAPABILITIES_DIR,
        capabilities
    );

    const tools = [
        buildRunTsTool(resolvedCapabilities,),
    ];

    //пока что агент имеет дело только с теми capabilities, что может сам запускать через execute
    const executableCapabilityIds = resolvedCapabilities
        .filter(({ access }) => access === "execute" || access === "both",)
        .map(({ definition, }) => definition.id,);

    while (true) {
        throwIfAborted(signal);

        /*
         * Pending tools всегда исполняются
         * раньше следующего model turn.
         *
         * Они могут появиться:
         *
         * 1. после allow в текущем запуске;
         * 2. из checkpoint после resume.
         *
         * В случае resume preToolUse повторно
         * не вызывается: само продолжение запуска
         * означает, что pending tools уже разрешены.
         */
        if (pendingToolCalls.length > 0) {
            const execution = await toolExecutor(
                {
                    toolCalls: pendingToolCalls,
                    capabilityIds: executableCapabilityIds,
                    context: agentContext,
                    sandboxTimeout,
                    signal,
                },
                identity,
                emit,
            );

            messages.push(...execution.output);

            pendingToolCalls = [];

            continue;
        }

        /*
         * Один turn = один обычный вызов модели.
         *
         * Pending tool execution turn не расходует.
         */
        if (turnsUsed >= maxTurns) {
            const finalMessages: ResponseInputItem[] = [
                ...messages,
                {
                    role: "system",
                    content:
                        "The maximum number of agent turns has been reached. " +
                        "Do not call tools. Provide the best final response using " +
                        "the information already available.",
                    status: 'completed'
                },
            ];

            const finalStep = await model(
                {
                    model: config.model,
                    messages: finalMessages,
                    tools: [],
                    signal,
                },
                identity,
                emit,
            );

            if (finalStep.status !== "completed") {
                throw new Error(
                    "Final model step requested tools while no tools were available",
                );
            }

            messages.push(...finalStep.output);

            await emitAgentEvent({
                event: "end",
                data: {
                    message: "Agent completed after reaching the turn limit",
                },
            });

            return {
                status: "turn_limit",
                state: {
                    messages,
                    activeRequest: null,
                },
            };
        }

        turnsUsed++;

        const step = await model(
            {
                model: config.model,
                messages,
                tools,
                signal,
                reasoning: {
                    effort: "none"
                },
            },
            identity,
            emit,
        );

        /*
         * Только agent владеет полной историей.
         * model возвращает output текущего turn.
         */
        messages.push(...step.output);

        if (step.status === "completed") {
            await emitAgentEvent({
                event: "end",
                data: {
                    message: "Agent completed",
                },
            });

            return {
                status: "completed",
                state: {
                    messages,
                    activeRequest: null,
                },
            };
        }

        const toolCalls = step.output.filter(
            (item,): item is ResponseFunctionToolCallItem =>
                item.type === "function_call",
        );

        if (toolCalls.length === 0) {
            throw new Error(
                "Model step has status 'tool_calls' but contains no function calls",
            );
        }

        const preToolUseResult =
            await hooks
                ?.preToolUse?.(
                    createPreToolUseContext(
                        identity,
                        toolCalls,
                    ),
                ) ?? {
                decision: "allow" as const,
            };

        switch (preToolUseResult.decision) {
            case "ask": {
                await emitAgentEvent({
                    event: "pause",
                    data: {
                        reason: "tool_approval_required",
                    },
                });

                /*
                 * Turn уже использован:
                 * модель была вызвана и создала tool calls.
                 */
                return {
                    status: "awaiting_tool_approval",
                    state: {
                        messages,
                        activeRequest: {
                            ...activeRequest,
                            turnsUsed,
                        },
                    },
                };
            }

            case "deny": {
                const deniedOutput = toolCalls.map(
                    (toolCall): ResponseInputItem.FunctionCallOutput => ({
                        type: "function_call_output",
                        call_id: toolCall.call_id,
                        output: JSON.stringify({
                            error: "tool_use_denied",
                            reason: preToolUseResult.reason,
                        }),
                    }),
                );

                messages.push(...deniedOutput,);

                /*
                 * Следующая итерация цикла станет
                 * следующим model turn.
                 */
                continue;
            }

            case "allow": {
                /*
                 * Здесь ничего не исполняется.
                 * Tool execution проходит
                 * через единую ветку в начале loop.
                 */
                pendingToolCalls = toolCalls;

                continue;
            }
        }
    }
}

function throwIfAborted(
    signal?: AbortSignal,
): void {
    if (signal?.aborted) {
        throw new Error(
            "Agent run aborted",
        );
    }
}