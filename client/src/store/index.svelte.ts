import type { AgentState, AgentEvent } from "../lib/types";

export const agentState = $state<AgentState>({
    name: "default",
    model: "",
    prompt: "",
    skills: [],
    toolRounds: 3,
    messages: [],
    runId: null
});

export type UploadEvent =
    | { event: 'upload_start', data: { name: string } }
    | { event: 'upload_done', data: { filename: string, type: string, path: string } }

export type AppEvent =
    | AgentEvent
    | UploadEvent

export const eventsState = $state<{
    events: AppEvent[]
}>({
    events: [],
})

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