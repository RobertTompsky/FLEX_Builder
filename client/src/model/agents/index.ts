import {
  agentsList,
} from "./list";

import {
  createAgentAction,
} from "./create";
import { getAgentModel } from "./registry";
import { deleteAgentAction } from "./delete";

export const agents = {
  list: agentsList,
  create: createAgentAction,
  get: getAgentModel,
  delete: deleteAgentAction
};