import { capability } from "../../services/capabilities";
import { openPageAction } from "./actions/open";

export const BROWSER_CAPABILITY_DEFINITION = {
    id: "browser",
    description: "Provides browser access to rendered web pages.",
}

export const browserCapabilitiy = capability({
    ...BROWSER_CAPABILITY_DEFINITION,
    actions: {
        open: openPageAction,
    },
});