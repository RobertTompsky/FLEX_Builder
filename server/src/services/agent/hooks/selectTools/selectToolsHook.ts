import OpenAI from "openai";

import type {
    SelectToolsHook,
} from "./hook";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const MIN_PROBABILITY = 0.15;

export function createSelectToolsHook(): SelectToolsHook {
    return async context => {
        const { messages, tools } = context;

        if (tools.length === 0) {
            return [];
        }

        const response = await openai.decisions.create({
            model: "gpt-6-luna",

            input: [
                {
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text: JSON.stringify({ messages }),
                        },
                    ],
                },
            ],

            questions: [
                {
                    type: "score",
                    name: "tool_selection",

                    instructions: `
                        Evaluate which tools are most relevant
                        to the agent's next step.

                        Consider the user's request,
                        conversation history and current
                        task progress.

                        Each level represents an available tool.

                        Identify the tools most likely to be
                        useful in the next step.

                        Evaluate relevance, not execution safety.
                        Tool execution permissions are
                        handled separately.
                    `.trim(),

                    levels: [
                        {
                            label: "none",
                            description:
                                "No tools are needed for the next model turn. " +
                                "The agent can respond using the available context.",
                        },

                        ...tools.map(tool => ({
                            label: tool.name,
                            description: tool.description,
                        })),
                    ],
                },
            ],
        });

        const answer = response.answers[0];

        if (!answer || answer.type !== "score") {
            throw new Error(
                "Tool selection decision returned no score",
            );
        }

        const probabilities = new Map(
            answer.probabilities.map(item => [item.label, item.probability]),
        );

        const scores = tools.map(tool => {
            const probability = probabilities.get(tool.name) ?? 0;

            return {
                name: tool.name,
                probability,
                selected: probability >= MIN_PROBABILITY,
            };
        });

        return scores;
    };
}