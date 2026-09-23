import { capability } from "../../services/capabilities";
import { createBrowserOpenAction } from "./actions/open";
import { BrowserContext } from "./actions/types";

export function createBrowserCapability(
    context: BrowserContext,
) {
    return capability({
        id: "browser",
        description: "Provides browser access to rendered web pages.",
        actions: {
            open: createBrowserOpenAction(context),
        },
    });
}