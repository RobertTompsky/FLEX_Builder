import { AgentCapabilityConfig } from "./capabilities";
export type AgentCheckpointConfig = {
    model: string;
    prompt: string;
    maxTurns: number;
    capabilities: AgentCapabilityConfig[];
    policies: {
        preToolUse:
        | "allow"
        | "ask"
        | "deny";
    };
};