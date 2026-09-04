import type {
    AgentCapabilityConfig,
} from "@flex-builder/shared/capabilities";

import { db } from "../index";

export async function getCapabilitiesByAgentId(
    agentId: string,
): Promise<AgentCapabilityConfig[]> {
    return db
        .selectFrom("agent_capabilities")
        .select([
            "capability_id as id",
            "access",
        ])
        .where("agent_id", "=", agentId)
        .execute();
}

export async function setCapabilitiesForAgent(
    agentId: string,
    capabilities: AgentCapabilityConfig[],
): Promise<void> {
    await db.transaction().execute(async (trx) => {
        await trx
            .deleteFrom("agent_capabilities")
            .where("agent_id", "=", agentId)
            .execute();

        if (capabilities.length === 0) {
            return;
        }

        await trx
            .insertInto("agent_capabilities")
            .values(
                capabilities.map((capability) => ({
                    agent_id: agentId,
                    capability_id: capability.id,
                    access: capability.access,
                })),
            )
            .execute();
    });
}

export async function deleteCapabilitiesByAgentId(
    agentId: string,
): Promise<void> {
    await db
        .deleteFrom("agent_capabilities")
        .where("agent_id", "=", agentId)
        .execute();
}