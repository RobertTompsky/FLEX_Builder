import { CapabilityEvent } from '../capabilities/capabilities.events';
import type { AgentEvent } from './agent.events'
import { AgentIdentity } from './agent.types';

export type AgentSourceEvent =
  | AgentEvent
  | CapabilityEvent;

export type ToAgentSSEMessage<
  T extends AgentSourceEvent,
> =
  T extends unknown
  ? {
    event: T["event"];
    data: {
      agent: AgentIdentity;
      data: T["data"];
    };
  }
  : never;

export function toAgentSSEMessage<
  T extends AgentSourceEvent,
>(
  agent: AgentIdentity,
  event: T,
): ToAgentSSEMessage<T> {
  return {
    event: event.event,
    data: {
      agent,
      data: event.data,
    },
  } as ToAgentSSEMessage<T>;
}

export type AgentSSEMessage =
  ToAgentSSEMessage<AgentSourceEvent>;