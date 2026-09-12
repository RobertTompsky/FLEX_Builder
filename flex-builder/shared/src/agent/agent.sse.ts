import { CapabilityEvent } from '../capabilities/capabilities.events';
import type { AgentEvent } from './agent.events'
import { AgentIdentity } from './agent.types';
export type CodeExecutionEvent =
    | {
        event: "started";
        data: {
            pid: number;
        };
    }
    | {
        event: "timeout";
        data: {
            timeoutMs: number;
        };
    }
    | {
        event: "output_exceeded";
        data: {
            maxOutputBytes: number;
        };
    }
    | {
        event: "exit";
        data: {
            exitCode: number | null;
        };
    };
    
export type AgentSourceEvent =
  | AgentEvent
  | CapabilityEvent
  | CodeExecutionEvent;

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