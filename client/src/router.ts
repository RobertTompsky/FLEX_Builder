import {
    createRouter,
} from "sv-router";

import HomePage from "./pages/HomePage/index.svelte";
import AgentPage from "./pages/AgentPage/index.svelte";

const routes = {
  "/": HomePage,

  "/agents": {
    "/:agentId": {
      "/": AgentPage,
    },
  },
} as const;

export const router = createRouter(routes);