import type { AgentState, AgentEvent } from "../lib/types";

export const agentState = $state<AgentState>({
    name: "default",
    model: "",
    prompt: "",
    skills: [],
    toolRounds: 3,
    messages: [],
});

export const eventsState = $state<{
    events: AgentEvent[]
}>({
    events: []
});

export const infoState = $state<{
    skills: string[];
    models: string[];
    loading: boolean;
    error: string | null;
}>({
    skills: [],
    models: [],
    loading: true,
    error: null,
});