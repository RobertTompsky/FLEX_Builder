import {
    ExecuteRpcClient,
} from "../../execute/rpc";

import {
    ExecutionStdioTransport,
} from "./stdio";

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

const transport = new ExecutionStdioTransport();

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