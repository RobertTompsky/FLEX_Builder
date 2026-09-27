import { capability } from "../../services/capabilities";
import {
    createRunSubagentAction,
    CreateSubagentTools,
    runSubagentActionMetadata
} from "./actions/runSubagent";

const instructions =
    await Bun.file(
        new URL(
            "./README.md",
            import.meta.url,
        ),
    ).text();

export const SUBAGENT_CAPABILITY_DEFINITION = {
    id: "subagent",
    description: "Delegates focused tasks to temporary subagents.",
};

// export const subagentPromptDefinition = {
//     ...SUBAGENT_CAPABILITY_DEFINITION,
//     instructions,
//     actions: {
//         run:
//             runSubagentActionMetadata,
//     },
// };

export function createSubagentCapability({
    createTools,
}: {

    createTools: CreateSubagentTools;
}) {
    return capability({
        ...SUBAGENT_CAPABILITY_DEFINITION,
        instructions,
        actions: {
            run: createRunSubagentAction({ createTools })
        }
    })
}