export type AgentSummary = {
  id: string;
  name: string;
  model: string;
  status: "active" | "idle" | "error";
  lastRun?: string;
  filesCount?: number;
};

export const mockAgents: AgentSummary[] = [
  {
    id: "default",
    name: "default",
    model: "gpt-5.4-mini",
    status: "active",
    lastRun: "2m ago",
    filesCount: 7,
  },
  {
    id: "research-agent",
    name: "research-agent",
    model: "gpt-5.4-mini",
    status: "active",
    lastRun: "18m ago",
    filesCount: 3,
  },
  {
    id: "crypto-bot",
    name: "crypto-bot",
    model: "gpt-5.4-mini",
    status: "active",
    lastRun: "1h ago",
    filesCount: 5,
  },
  {
    id: "web-scout",
    name: "web-scout",
    model: "gpt-4o-mini",
    status: "idle",
    lastRun: "2h ago",
    filesCount: 2,
  },
  {
    id: "planner",
    name: "planner",
    model: "gpt-5.4-mini",
    status: "active",
    lastRun: "1d ago",
    filesCount: 4,
  },
  {
    id: "support-agent",
    name: "support-agent",
    model: "gpt-4o-mini",
    status: "active",
    lastRun: "2d ago",
    filesCount: 1,
  },
];