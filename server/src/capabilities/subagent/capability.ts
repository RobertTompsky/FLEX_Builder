import { capability } from "../../services/capabilities";
import { createRunSubagentAction, CreateSubagentTools, runSubagentActionMetadata, SubagentContext } from "./actions/runSubagent";

const instructions =
    await Bun.file(
        new URL(
            "./README.md",
            import.meta.url,
        ),
    ).text();

export const subagentMetadata = {
    id: "subagent",

    description:
        "Delegates focused tasks to temporary subagents.",

    instructions,
};

export const subagentPromptDefinition = {
    ...subagentMetadata,

    actions: {
        run:
            runSubagentActionMetadata,
    },
};

// export function createSubagentCapability({
//     context,
//     createTools,
// }: {
//     context: SubagentContext;
//     createTools: CreateSubagentTools;
// }) {
//     return capability({
//         definition: {
//             ...subagentMetadata,

//             actions: {
//                 run:
//                     createRunSubagentAction(
//                         createTools,
//                     ),
//             },
//         },

//         createContext: () =>
//             context,
//     });
// }