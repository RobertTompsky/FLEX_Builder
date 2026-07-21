import { Elysia } from "elysia";

import type {
  AgentStore,
} from "../../agents/store";
import { CreateAgentBodySchema } from "../schemas";

export function createAgentRoute(
  store: AgentStore,
) {
  return new Elysia().post(
    "/",
    async ({ body, set }) => {
      const snapshot = await store.create(body);

      set.status = 201;

      return snapshot;
    },
    {
      body: CreateAgentBodySchema,
    },
  );
}