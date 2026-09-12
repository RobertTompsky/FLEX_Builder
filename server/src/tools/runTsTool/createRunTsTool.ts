import { CodeGenSchema, ExecutionSource } from "@flex-builder/shared/capabilities";
import { createCapabilityExecutor } from "../../services/capabilities/capabilityExecutor";
import { createActionRegistry, registerCapability } from "../../services/capabilities/registry";
import { Tool } from "../../services/tools/types";
import { CreateRunTsToolInput } from "./types";
import { z } from 'zod'
import { executeRunTs } from "./executeRunTs";

export function createRunTsTool({
    runId,
    workspace,
    description,
    resolveCapabilities,
    onEvent,
}: CreateRunTsToolInput): Tool<
    z.infer<typeof CodeGenSchema>
> {
    return {
        name: "runTs",
        description,
        inputSchema: CodeGenSchema,
        async execute(
            input,
            context,
        ) {
            const source: ExecutionSource = {
                runId,
                toolCallId:                    context.callId,
            };

            const capabilities = await resolveCapabilities(source);

            const actionRegistry = createActionRegistry();

            for (
                const {
                    plugin,
                    access,
                } of capabilities
            ) {
                if (
                    access !== "execute" &&
                    access !== "both"
                ) {
                    continue;
                }

                await registerCapability(
                    actionRegistry,
                    plugin,
                );
            }

            const executeCapability =
                createCapabilityExecutor(
                    actionRegistry,
                );

            return executeRunTs({
                code: input.code,
                workspace,
                signal: context.signal,
                executeCapability,
                onEvent,
            });
        },
    };
}