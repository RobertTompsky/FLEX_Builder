import path from "path";

import {
    ChildProcessTransport,
} from "../rpc/stdio/childProcess";

export function createSandboxTransport() {
    const sandboxEntry = path.join(
        import.meta.dir,
        "server-entry.ts",
    );

    return new ChildProcessTransport({
        command: "bun",
        args: [
            sandboxEntry,
        ],
        cwd: process.cwd(),
        stderr: "inherit",
    });
}