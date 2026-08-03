import { Elysia } from "elysia";

import type {
  AgentStore,
} from "../../agents/store/store";
import { CreateAgentBodySchema } from "../schemas";

export function createAgentRoute(
  store: AgentStore,
) {
  return new Elysia().post(
    "/",
    async ({ set }) => {
      //временно, потом дефолтное имя будет создаваться вместе с начальным чекпоинтом
      const snapshot = await store.create({
        name: 'default'
      });

      set.status = 201;

      return snapshot.identity;
    },
    // {
    //   body: CreateAgentBodySchema,
    // },
  );
}