import { Elysia } from "elysia";

import type {
  AgentStore,
} from "../../agents/store/store";

export function listAgentsRoute(
  store: AgentStore,
) {
  return new Elysia().get(
    "/",
    async () => {
      const agents = (await store.list()).map((agent) => ({
        
      }))

      return store.list();
    },
  );
}