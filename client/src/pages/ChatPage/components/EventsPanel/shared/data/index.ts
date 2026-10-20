import type { EventBlockCategory } from "../ui/EventBlock";

export const EVENT_CATEGORIES: {
  id: EventBlockCategory;
  label: string;
}[] = [
    {
      id: "status",
      label: "STATUS",
    },
    {
      id: "model",
      label: "MODEL",
    },
    {
      id: "tool",
      label: "TOOL",
    },
    {
      id: "policy",
      label: "POLICY",
    },
    {
      id: "sandbox",
      label: "SANDBOX",
    },
    {
      id: "execution",
      label: "EXECUTION",
    },
    {
      id: "rpc",
      label: "RPC",
    },
    {
      id: "result",
      label: "RESULT",
    },
    {
      id: "error",
      label: "ERROR",
    },
  ];