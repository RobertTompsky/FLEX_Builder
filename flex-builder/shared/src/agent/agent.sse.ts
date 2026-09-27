import { CapabilityEvent } from '../capabilities/capabilities.events';
import { ExecutionEvent, ExecutionSource } from '../sandbox';
import type { AgentEvent } from './agent.events'
import { AgentIdentity } from './agent.types';

type WithExecutionSource = {
  source: ExecutionSource;
};

export type AgentSourceEvent =
  | AgentEvent
  | (
    (
      | CapabilityEvent
      | ExecutionEvent
    ) & WithExecutionSource
  );

export type ToAgentSSEMessage<
  T extends AgentSourceEvent,
> =
  T extends unknown
  ? {
    event:
    T["event"];

    data: {
      agent:
      AgentIdentity;

      data:
      T["data"];
    } & (
      T extends {
        source:
        infer TSource;
      }
      ? {
        source:
        TSource;
      }
      : {}
    );
  }
  : never;

export function toAgentSSEMessage<
  T extends AgentSourceEvent,
>(
  agent:
    AgentIdentity,

  event:
    T,
): ToAgentSSEMessage<T> {
  return {
    event:
      event.event,

    data: {
      agent,

      data:
        event.data,

      ...(
        "source" in event
          ? {
            source:
              event.source,
          }
          : {}
      ),
    },
  } as ToAgentSSEMessage<T>;
}

export type AgentSSEMessage =
  ToAgentSSEMessage<AgentSourceEvent>;