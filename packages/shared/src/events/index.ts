import { AgentIdentity } from "../types/agent";
import { AgentEvent } from "./agent";
import { CapabilityEvent } from "./capabiliites";

export type AgentStreamEvent = {
    agent: AgentIdentity;
    event:
        | AgentEvent
        | CapabilityEvent;
};