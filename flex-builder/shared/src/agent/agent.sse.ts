import type { AgentEvent, AgentIdentity } from ".";
import type { CapabilityEvent } from "../capabilities";
import type { RunEvent } from "../run/events";
import type { ExecutionEvent, ExecutionSource } from "../sandbox";

type WithExecutionSource = {
  source: ExecutionSource;
};

export type AgentSourceEvent =
  | RunEvent
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
    event: T["event"];

    data: {
      agent: AgentIdentity;
      data: T["data"];
    } & (
      T extends {
        source: infer TSource;
      }
      ? {
        source: TSource;
      }
      : {}
    );
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

      ...(
        "source" in event
          ? {
            source: event.source,
          }
          : {}
      ),
    },
  } as ToAgentSSEMessage<T>;
}

export type AgentSSEMessage =
  ToAgentSSEMessage<AgentSourceEvent>;