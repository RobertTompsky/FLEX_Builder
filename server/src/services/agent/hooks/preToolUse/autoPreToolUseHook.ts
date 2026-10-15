import type {
    AgentEventHandler,
} from "@flex-builder/shared/agent";

import OpenAI from "openai";

import type {
    PreToolUseHook,
} from "./hook";
import { PRE_TOOL_USE_POLICIES } from "@flex-builder/shared/hooks";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export function createAutoPreToolUseHook(
    emit?: AgentEventHandler,
): PreToolUseHook {
    return async context => {
        const response =
            await openai.decisions.create({
                model: "gpt-6-luna",
                input: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "input_text",
                                text: `
                                Tool calls proposed for execution:
                                
                                ${JSON.stringify(
                                    context.toolCalls,
                                    null,
                                    2,
                                )}
                                `.trim(),
                            },
                        ],
                    },
                ],
                questions: [
                    {
                        type: "choice",
                        name: "pre_tool_use",
                        instructions: `
                        Review the proposed tool calls and decide whether they may execute automatically,
                        require explicit user approval, or should be denied.
                        
                        Evaluate the calls using the following criteria:
                        
                        1. Side effects
                        - Does the code modify files, external systems, accounts, or persistent state?
                        - Does it send, publish, upload, delete, overwrite, or mutate anything?
                        
                        2. Irreversibility
                        - Could the action be difficult or impossible to undo?
                        - Could it delete or corrupt data?
                        
                        3. External impact
                        - Does it affect systems outside the local agent workspace?
                        - Does it communicate with third-party APIs or services?
                        
                        4. Cost and resource usage
                        - Could it spend money, consume paid API quota, or create unusually high resource usage?
                        - Does it perform many repeated calls, loops, retries, or large batch operations?
                        
                        5. Concurrency and fan-out
                        - Does the code use Promise.all, Promise.allSettled, or another parallel execution pattern?
                        - Could it trigger many capability calls concurrently?
                        - Is the number of parallel operations large, unbounded, or derived from input data?
                        
                        6. Scope
                        - Is the operation narrowly scoped to what the user requested?
                        - Does it access or modify substantially more data than necessary?
                        
                        7. Sensitive data
                        - Could it expose secrets, credentials, personal data, private files, or other sensitive information?
                        
                        8. Uncertainty
                        - Are the consequences unclear because arguments, targets, loops, concurrency,
                          or generated code are difficult to bound?
                        
                        Choose:
                        - allow: low-risk, bounded, expected, and safe to execute automatically.
                        - ask: legitimate, but has meaningful side effects, high concurrency, cost,
                          broad scope, irreversibility, or uncertainty requiring confirmation.
                        - deny: clearly unsafe, destructive, abusive, or outside acceptable execution boundaries.
                        `.trim(),
                        choices: [
                            {
                                value: "allow",
                                description: "Execute automatically. Low-risk, bounded, reversible or read-only, "
                                    + "with limited resource usage and concurrency.",
                            },
                            {
                                value: "ask",
                                description: "Require explicit user approval. The operation may have meaningful "
                                    + "side effects, cost, broad scope, high concurrency, or uncertain consequences.",
                            },
                            {
                                value: "deny",
                                description: "Do not execute. The operation is clearly unsafe, destructive, abusive, "
                                    + "or presents unacceptable risk.",
                            },
                        ],
                    },
                ],
            });

        const answer = response.answers[0];

        if (answer.type === "refusal") {
            return {
                decision: "ask",
                reason: "Automatic review could not determine whether execution is safe.",
            };
        }

        if (answer.type !== "choice") {
            throw new Error(
                `Unexpected decision answer type: ${answer.type}`,
            );
        }

        const probabilities = new Map(
            answer.probabilities.map(item => [
                String(item.value),
                item.probability,
            ]),
        );

        const decision = PRE_TOOL_USE_POLICIES
            .filter(v => v !== 'auto')
            .find(value => value === answer.choice);

        if (!decision) {
            return {
                decision: "ask",
                reason: "Automatic review returned an unknown decision.",
            };
        }

        await emit?.({
            event: "pre_tool_use",
            data: {
                model: "gpt-6-luna",
                decision,
                confidence: answer.confidence,
                probabilities: {
                    allow: probabilities.get("allow") ?? 0,
                    ask: probabilities.get("ask") ?? 0,
                    deny: probabilities.get("deny") ?? 0,
                },
            },
        });

        switch (answer.choice) {
            case "allow":
                return {
                    decision: "allow",
                };
            case "ask":
                return {
                    decision: "ask",
                    reason: "Automatic review requires user approval.",
                };
            case "deny":
                return {
                    decision: "deny",
                    reason: "Automatic review denied execution.",
                };
            default:
                return {
                    decision: "ask",
                    reason: "Automatic review returned an unknown decision.",
                };
        }
    };
}