import { z } from "zod";

const CapabilityRpcCallSchema =
    z.object({
        type:
            z.literal(
                "capability_call",
            ),

        id:
            z.string(),

        action:
            z.string(),

        args:
            z.unknown(),
    });

const CapabilityRpcCancelSchema =
    z.object({
        type:
            z.literal(
                "capability_cancel",
            ),

        id:
            z.string(),
    });

const CapabilityRpcResultSchema =
    z.discriminatedUnion(
        "ok",
        [
            z.object({
                type:
                    z.literal(
                        "capability_result",
                    ),

                id:
                    z.string(),

                ok:
                    z.literal(true),

                result:
                    z.unknown(),
            }),

            z.object({
                type:
                    z.literal(
                        "capability_result",
                    ),

                id:
                    z.string(),

                ok:
                    z.literal(false),

                error:
                    z.string(),
            }),
        ],
    );

export const CapabilityRpcMessageSchema =
    z.union([
        CapabilityRpcCallSchema,
        CapabilityRpcCancelSchema,
        CapabilityRpcResultSchema,
    ]);