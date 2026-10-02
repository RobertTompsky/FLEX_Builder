import z from 'zod'
import { AgentConfigSchema, AgentIdentitySchema } from './agent.schemas';
import { AgentCapabilityConfig } from '../capabilities';
import { Chat } from '../chat';

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

export type AgentDetails =
    Agent & {
        capabilities: AgentCapabilityConfig[];
    };