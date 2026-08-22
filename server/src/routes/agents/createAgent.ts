import { Elysia } from "elysia";

import type {
  AgentStore,
} from "../../agents/store/store";
import { AgentListItem } from "@flex-builder/shared/agent";

export function createAgentRoute(
  store: AgentStore,
) {
  return new Elysia().post(
    "/",
    async ({ set }) => {
      //временно, потом дефолтное имя будет создаваться вместе с начальным чекпоинтом
      const snapshot = await store.create();

      set.status = 201;

      const listItem: AgentListItem = {
        ...snapshot.identity,
        updatedAt: snapshot.checkpoint.updatedAt,
      };

      return listItem;
    },
    // {
    //   body: CreateAgentBodySchema,
    // },
  );
}