import { defineAction } from "../../runtime/globals/execute/defineAction";
import { newsInputSchema, newsOutputSchema, searchWeb } from "./searchWeb";

export const actions = {
    search_web: defineAction({
        description: "Searches the internet for news, articles, and other up-to-date web information.",
        inputSchema: newsInputSchema,
        outputSchema: newsOutputSchema,
        handler: searchWeb,
    }),
};