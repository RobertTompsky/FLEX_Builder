import z from 'zod'
import { AgentCheckpointConfigSchema, AgentIdentitySchema } from './agent.schemas';

export type AgentIdentity = z.infer<typeof AgentIdentitySchema>;

export type ActiveRequest = {
    id: string;
    turnsUsed: number;
};

export type AgentState<
    TState extends {
        messages: unknown;
    },
> = {
    messages: TState["messages"][];
    activeRequest: ActiveRequest | null;
};

export type UIAgentState = AgentState<{
  messages: UIMessage;
}>;

export type UIAgentCheckpoint = {
  updatedAt: number;
  data: {
    config: AgentCheckpointConfig;
    state: UIAgentState;
  };
};

export type UISnapshot = {
  identity: AgentIdentity;
  checkpoint: UIAgentCheckpoint | null;
};

export type AgentListItem = AgentIdentity & {
    updatedAt: number;
};

export type UpdateAgentInput = {
    name: string;
    config: AgentCheckpointConfig;
};

export type UIMessage = {
    role: "assistant" | "user";
    content: string;
    status?: "in_progress" | "completed" | "incomplete";
};

export type AgentCheckpointConfig = z.infer<typeof AgentCheckpointConfigSchema>

export type AgentSnapshot<
  TCheckpoint = UIAgentCheckpoint,
> = {
  identity: AgentIdentity;
  checkpoint: TCheckpoint;
};