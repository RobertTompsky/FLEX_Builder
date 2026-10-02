import type { MetadataResponse } from "@flex-builder/shared/metadata";
import { API_URL, parseResponse } from "./shared";

async function getMetadata(
  signal?: AbortSignal,
): Promise<MetadataResponse> {
  const response = await fetch(
    `${API_URL}/metadata`,
    {
      method: "GET",
      signal,
    },
  );

  return parseResponse<MetadataResponse>(
    response,
  );
}

export const metadataApi = {
  get: getMetadata,
}