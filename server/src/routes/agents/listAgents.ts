import { Elysia } from "elysia";

import type {
  AgentStore,
} from "../../agents/store";

export function listAgentsRoute(
  store: AgentStore,
) {
  return new Elysia().get(
    "/",
    async () => {
      return store.list();
    },
  );
}