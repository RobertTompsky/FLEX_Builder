export type RunEvent = {
    event: "status";
    data: {
        runId: string;
        status:
        | "running"
        | "paused"
        | "completed"
        | "stopped"
        | "failed";
        reason?: string;
    };
};