import { defineAction } from "../../runtime/execute/defineAction";
import { newsSearchSchema, searchWeb } from "./searchWeb";

export const actions = {
    search_web: defineAction({
        description: "Searches the internet for news, articles, and other up-to-date web information.",
        inputSchema: newsSearchSchema,
        handler: searchWeb,
    }),
};