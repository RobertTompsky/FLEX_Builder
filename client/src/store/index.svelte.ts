import type { AgentState, AgentEvent, AppEvent } from "../lib/types";

export const agentState = $state<AgentState>({
    name: "default",
    model: "",
    prompt: "",
    files: new Set(),
    skills: [],
    toolRounds: 3,
    messages: [],
    runId: null
});

export const eventsState = $state<{
    events: AppEvent[]
}>({
    events: [],
})

export const infoState = $state<{
    uploads: string[],
    skills: string[];
    models: string[];
    loading: boolean;
    error: string | null;
}>({
    uploads: [],
    skills: [],
    models: [],
    loading: true,
    error: null,
});