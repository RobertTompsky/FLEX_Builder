import { capability } from "../../services/capabilities";
import { open } from "./open";

export const browserDefinition = {
    id: "browser",
    description: "Interact with web pages using a real browser.",
    actions: {
        open,
    },
}

export const browserCapability = capability({
    definition: browserDefinition,
})