import { CapabilityRpcMessageSchema } from "./schemas";
import type {
    CapabilityRpcMessage,
} from "./types";

export const CAPABILITY_RPC_PREFIX =
    "__CAPABILITY_RPC__";

export function serializeRpcMessage(
    message: CapabilityRpcMessage,
): string {
    return (
        CAPABILITY_RPC_PREFIX +
        JSON.stringify(message)
    );
}

export function parseRpcMessage(
    line: string,
): CapabilityRpcMessage | undefined {
    if (
        !line.startsWith(
            CAPABILITY_RPC_PREFIX,
        )
    ) {
        return undefined;
    }

    const raw =
        line.slice(
            CAPABILITY_RPC_PREFIX.length,
        );

    let parsed: unknown;

    try {
        parsed =
            JSON.parse(raw);
    } catch {
        return undefined;
    }

    const result =
        CapabilityRpcMessageSchema
            .safeParse(parsed);

    if (!result.success) {
        return undefined;
    }

    return result.data;
}