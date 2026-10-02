export const API_URL = "http://localhost:3000";

export type APIErrorResponse = {
  ok: false;
  error: string;
};

export type RequestOptions = {
  signal?: AbortSignal;
};

export type SSEOptions<TEvent> =
  RequestOptions & {
    onEvent: (
      event: TEvent,
    ) => void;
  };

export async function parseResponse<T>(
  response: Response,
): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>;
  }

  const data = await response
    .json()
    .catch(() => null) as APIErrorResponse | null;

  throw new Error(
    data?.error ??
    `Request failed: HTTP ${response.status}`,
  );
}