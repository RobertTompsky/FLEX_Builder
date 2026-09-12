import { capability } from "../../services/capabilities";
import { downloadAction } from "./actions/download";
import { searchWebAction } from "./actions/searchWeb";

export const webDefinition = {
        id: 'web',
        description: "Provides access to the internet and enables interaction with web resources.",
        actions: {
            search_web: searchWebAction,
            download: downloadAction
        },
    }

export const webCapability = capability({
    definition: webDefinition
});