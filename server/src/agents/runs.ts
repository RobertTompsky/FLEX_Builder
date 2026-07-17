export function createRunStore() {
    const runs = new Map<
        string,
        Map<string, AbortController>
    >();

    function get(
        agentId: string,
        runId: string,
    ): AbortController | undefined {
        return runs.get(agentId)?.get(runId);
    }

    function set(
        agentId: string,
        runId: string,
        controller: AbortController,
    ): void {
        let agentRuns = runs.get(agentId);

        if (!agentRuns) {
            agentRuns = new Map();
            runs.set(agentId, agentRuns);
        }

        agentRuns.set(runId, controller);
    }

    function remove(
        agentId: string,
        runId: string,
    ): boolean {
        const agentRuns = runs.get(agentId);

        if (!agentRuns) {
            return false;
        }

        const deleted = agentRuns.delete(runId);

        if (agentRuns.size === 0) {
            runs.delete(agentId);
        }

        return deleted;
    }

    return {
        get,
        set,
        delete: remove,
    };
}

export type RunStore = ReturnType<
    typeof createRunStore
>;