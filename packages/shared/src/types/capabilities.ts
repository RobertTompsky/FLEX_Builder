export type CapabilityAccess = "execute" | "delegate" | "both"

export type AgentCapabilityConfig = {
    id: string;
    access: CapabilityAccess
};