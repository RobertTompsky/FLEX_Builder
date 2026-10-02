import { z } from "zod";

import {
    AgentConfigSchema,
    AgentIdentitySchema,
} from "./agent.schemas";

import {
    AgentCapabilityConfigSchema,
} from "../capabilities/cababilities.schemas";

import type {
    AgentCapabilityConfig,
} from "../capabilities/capabilities.types";

import type {
    Agent,
} from "./agent.types";

import type {
    Chat,
} from "../chat";

export const AgentParamsSchema = z.object({
    agentId: z.string().min(1),
});

export type AgentParams = z.infer<typeof AgentParamsSchema>;

export const UpdateAgentBodySchema = z.object({
    name: AgentIdentitySchema.shape.name,
    config: AgentConfigSchema,
    capabilities:
        z.array(
            AgentCapabilityConfigSchema,
        ),
});

export type UpdateAgentBody =
    z.infer<typeof UpdateAgentBodySchema>;

export type GetAgentResponse =
    Agent & {
        capabilities: AgentCapabilityConfig[];
        chats: Chat[];
    };

export type UpdateAgentResponse =
    Omit<
        GetAgentResponse,
        "chats"
    >;