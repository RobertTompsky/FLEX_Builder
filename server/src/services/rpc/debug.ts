import type {
    JsonRpcMessage,
} from "./protocol";

console.error(
    "[rpc-debug:init]",
    process.pid,
    process.env.RPC_DEBUG,
);

export function debugRpc(
    direction:
        | "send"
        | "receive",

    message: JsonRpcMessage,
) {
    if (process.env.RPC_DEBUG !== "1") {
        return;
    }

    const prefix = `[rpc:${process.pid}]`;

    if (
        "method" in message
    ) {
        const id =
            "id" in message
                ? message.id
                : "notification";

        console.error(
            prefix,
            direction === "send"
                ? "→"
                : "←",
            message.method,
            `#${id}`,
            summarizeParams(
                message.params,
            ),
        );

        return;
    }

    console.error(
        prefix,
        direction === "send"
            ? "→"
            : "←",
        "response",
        `#${message.id}`,
        "error" in message
            ? {
                error:
                    message.error,
            }
            : {
                result:
                    summarizeValue(
                        message.result,
                    ),
            },
    );
}

function summarizeParams(
    params: unknown,
) {
    if (
        !params ||
        typeof params !== "object"
    ) {
        return params;
    }

    const value = params as Record<
        string,
        unknown
    >;

    /*
     * Для execute особенно полезно.
     */
    if (
        "executionId" in value &&
        "input" in value
    ) {
        const input =
            value.input;

        if (
            input &&
            typeof input === "object"
        ) {
            const executeInput =
                input as Record<
                    string,
                    unknown
                >;

            return {
                executionId:
                    value.executionId,

                capability:
                    executeInput.capability,

                action:
                    executeInput.action,
            };
        }
    }

    /*
     * Не печатаем огромный code целиком.
     */
    if (
        "code" in value &&
        typeof value.code ===
        "string"
    ) {
        return {
            ...value,

            code:
                `<${value.code.length} chars>`,
        };
    }

    return value;
}

function summarizeValue(
    value:
        unknown,
) {
    if (
        typeof value ===
        "string" &&
        value.length > 500
    ) {
        return `<${value.length} chars>`;
    }

    return value;
}