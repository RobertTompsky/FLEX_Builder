import { defineCapability } from "../../runtime/execute/defineCapability";
import { searchWebAction } from "./actions/searchWeb";

export default defineCapability({
    id: 'web',
    description: "Provides access to the internet and enables interaction with web resources.",
    actions: {
        search_web: searchWebAction,
    },
});