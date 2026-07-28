import { AgentEvent } from "../../agents/events";
import { AgentIdentity } from "../../agents/shared/schemas";
import { ArtifactEvent } from "../artifact/events";

export type SubagentEvent = {
  event: "subagent_event";
  data: {
    parentRunId: string;
    subagentCallId: string;
    subagent: AgentIdentity;
    event: AgentEvent | ArtifactEvent;
  };
};