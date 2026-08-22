import { 
  AgentIdentity, 
  AgentSourceEvent, 
  AgentSSEMessage, 
  toAgentSSEMessage 
} from "@flex-builder/shared/agent";

interface SSEMessage {
  data: string | Promise<string>
  event?: string
  id?: string
  retry?: number
}

type SerializedSSEMessage = Omit<SSEMessage, "data"> & {
  data: unknown;
};

export type SSE = {
  send(message: SSEMessage): Promise<void>
  close(): void
  sleep(ms: number): Promise<void>
  readonly closed: boolean
}

export function streamSSE(
  handler: (sse: SSE) => Promise<void> | void,
) {
  const encoder = new TextEncoder()

  let controller: ReadableStreamDefaultController<Uint8Array>
  let closed = false

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl
    },
    cancel() {
      closed = true
    },
  })

  const write = (chunk: string) => {
    if (closed) return

    controller.enqueue(encoder.encode(chunk))
  }

  const sse: SSE = {
    async send(message) {
      if (closed) return

      let payload = ''

      if (message.event) {
        payload += `event: ${message.event}\n`
      }

      if (message.id) {
        payload += `id: ${message.id}\n`
      }

      if (message.retry !== undefined) {
        payload += `retry: ${message.retry}\n`
      }

      const data = await message.data

      for (const line of data.split(/\r?\n/)) {
        payload += `data: ${line}\n`
      }

      payload += '\n'

      write(payload)
    },

    close() {
      if (closed) return

      closed = true
      controller.close()
    },

    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms))
    },

    get closed() {
      return closed
    },
  }

  void (async () => {
    try {
      await handler(sse)
    } catch (error) {
      await sse.send({
        event: 'error',
        data: error instanceof Error ? error.message : String(error),
      })
    } finally {
      sse.close()
    }
  })()

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

export type Emit<E> = (ev: E) => void | Promise<void>

export function createAgentEmitter<
  TEvent extends AgentSourceEvent
>(
  identity: AgentIdentity,
  emit?: Emit<AgentSSEMessage>,
  signal?: AbortSignal,
): Emit<TEvent> {
  if (!emit) {
    return async () => { };
  }

  return async (event) => {
    if (
      signal?.aborted &&
      event.event !== "stop"
    ) {
      return;
    }

    await emit(
      toAgentSSEMessage(
        identity,
        event,
      ),
    );
  };
}

export function createSSEWriter<
  E extends SerializedSSEMessage,
>(
  sse: SSE,
): Emit<E> {
  return async (event) => {
    await sse.send({
      ...event,
      data:
        JSON.stringify(event.data) ??
        "null",
    });
  };
}