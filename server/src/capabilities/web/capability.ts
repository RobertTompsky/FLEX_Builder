import { capability } from "../../runtime/execute";
import { searchWebAction } from "./actions/searchWeb";

export const webCapability = capability({
    id: 'web',
    description: "Provides access to the internet and enables interaction with web resources.",
    actions: {
        search_web: searchWebAction,
    },
});