import { capability } from "../../runtime/execute";
import { runSubagentAction } from "./actions/runSubagent";

const instructions =
    await Bun.file(
        new URL(
            "./README.md",
            import.meta.url,
        ),
    ).text();

export const subagentCapability = capability({
    id: "subagent",

    description: "Delegates focused tasks to temporary subagents.",

    instructions,

    actions: {
        run: runSubagentAction,
    },
});