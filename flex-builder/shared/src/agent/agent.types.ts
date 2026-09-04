import z from 'zod'
import { AgentConfigSchema, AgentIdentitySchema } from './agent.schemas';
import { AgentCapabilityConfig } from '../capabilities';

export type AgentIdentity = z.infer<typeof AgentIdentitySchema>;

export type AgentConfig = z.infer<typeof AgentConfigSchema>

export type Agent = {
    identity: AgentIdentity;
    config: AgentConfig;
    createdAt: number;
    updatedAt: number;
};

export type AgentListItem = AgentIdentity & {
    updatedAt: number;
};

export type UIMessage = {
    role: "assistant" | "user";
    content: string;
    status?: "in_progress" | "completed" | "incomplete";
};

export type AgentSnapshot<
    TMessage = UIMessage,
> = Agent & {
    capabilities: AgentCapabilityConfig[]
    chats: TMessage[];
};

export type UIAgentSnapshot = AgentSnapshot<UIMessage>;