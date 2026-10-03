import {
  agentsList,
} from "./list";

import {
  createAgentAction,
} from "./create";
import { deleteAgentAction } from "./delete";

export const agents = {
  list: agentsList,
  create: createAgentAction,
  delete: deleteAgentAction
};