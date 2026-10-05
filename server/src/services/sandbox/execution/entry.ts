import {
    ExecuteRpcClient,
} from "../../execute/rpc";
import { ExecutionIpcTransport } from "./transport/execution";

import {
    sandboxGlobal,
} from "./scope";

const userFile = process.argv.at(2);

const executionId = process.argv.at(3);


if (!userFile) {
    throw new Error(
        "Missing user file",
    );
}

if (!executionId) {
    throw new Error(
        "Missing execution id",
    );
}

// process.send?.({
//     kind:
//         "debug",
//     message:
//         "entry alive",
// });

const transport = new ExecutionIpcTransport();


const executeClient = new ExecuteRpcClient();

await executeClient.connect(transport);

sandboxGlobal.execute =
    (
        input,
        options,
    ) =>
        executeClient.execute(
            {
                executionId,
                input,
            },

            options,
        );
try {
    await import(userFile);
} finally {
    await executeClient.close();

    await transport.close();
}