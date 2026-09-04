import { Elysia } from "elysia";
import { RouteDeps } from "../types";

type ListAgentsRouteDeps = Pick<RouteDeps, "agentRepository">

export function listAgentsRoute(
  deps: ListAgentsRouteDeps
) {
  return new Elysia().get(
    "/",
    async () => {
      return await deps.agentRepository.list();
    },
  );
}