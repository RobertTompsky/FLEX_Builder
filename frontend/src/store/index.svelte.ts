import type { AgentState, AgentEvent } from "../lib/types";

export const agentState = $state<AgentState>({
    name: "default",
    model: "",
    prompt: "",
    skills: [],
    messages: [],
});

export const eventsState = $state<{
    events: AgentEvent[]
}>({
    events: []
})