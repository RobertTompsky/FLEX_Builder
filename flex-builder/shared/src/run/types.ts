export type RunStatus =
  | "running"
  | "completed"
  | "stopped"
  | "failed"
  | "paused"

export type Run = {
  id: string;
  status: RunStatus;
  startedAt: string;
  finishedAt: string | null;
};