import {
    createCapabilityRpcClient,
} from "./rpc/client";

import {
    createExecute,
} from "./rpc/createExecute";

import {
    capabilitySandboxGlobal,
} from "./scope";

export { };

const userFile = process.argv.at(2);

if (!userFile) {
    throw new Error(
        "Sandbox user file path is missing",
    );
}

const client = createCapabilityRpcClient();

capabilitySandboxGlobal.execute = createExecute(client.call);

try {
    await import(userFile);
} finally {
    await client.close();
}