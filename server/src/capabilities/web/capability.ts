import { capability } from "../../services/capabilities";
import { downloadAction } from "./actions/download";
import { searchWebAction } from "./actions/searchWeb";

export const WEB_CAPABILITY_DEFINITION = {
    id: 'web',
    description: "Provides access to the internet and enables interaction with web resources."
}
export const webCapability = capability({
    ...WEB_CAPABILITY_DEFINITION,
    actions: {
        search_web: searchWebAction,
        download: downloadAction
    },
});