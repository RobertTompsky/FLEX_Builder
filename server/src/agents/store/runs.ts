export function createRunStore() {
    const runs = new Map<
        string,
        Map<
            string,
            Map<string, AbortController>
        >
    >();

    function get(
        agentId: string,
        chatId: string,
        runId: string,
    ): AbortController | undefined {
        return runs
            .get(agentId)
            ?.get(chatId)
            ?.get(runId);
    }

    function set(
        agentId: string,
        chatId: string,
        runId: string,
        controller: AbortController,
    ): void {
        let agentRuns =
            runs.get(agentId);

        if (!agentRuns) {
            agentRuns = new Map();

            runs.set(
                agentId,
                agentRuns,
            );
        }

        let chatRuns =
            agentRuns.get(chatId);

        if (!chatRuns) {
            chatRuns = new Map();

            agentRuns.set(
                chatId,
                chatRuns,
            );
        }

        chatRuns.set(
            runId,
            controller,
        );
    }

    // Пока запрещаем параллельные runs
    // внутри одного chat.
    function has(
        agentId: string,
        chatId: string,
    ): boolean {
        const chatRuns =
            runs
                .get(agentId)
                ?.get(chatId);

        return (
            chatRuns !== undefined &&
            chatRuns.size > 0
        );
    }

    function remove(
        agentId: string,
        chatId: string,
        runId: string,
    ): boolean {
        const agentRuns =
            runs.get(agentId);

        if (!agentRuns) {
            return false;
        }

        const chatRuns =
            agentRuns.get(chatId);

        if (!chatRuns) {
            return false;
        }

        const deleted =
            chatRuns.delete(runId);

        if (chatRuns.size === 0) {
            agentRuns.delete(chatId);
        }

        if (agentRuns.size === 0) {
            runs.delete(agentId);
        }

        return deleted;
    }

    return {
        get,
        set,
        has,
        delete: remove,
    };
}

export type RunStore =
    ReturnType<
        typeof createRunStore
    >;