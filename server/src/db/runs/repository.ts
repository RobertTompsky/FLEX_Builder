import {
    randomUUID,
} from "crypto";

import type {
    Run,
    RunStatus,
} from "@flex-builder/shared/run";

import {
    createRun,
    deleteRun,
    getRun,
    listRunsByChatId,
    updateRunStatus,
} from "./queries";

export interface RunRepository {
    create(
        chatId: string,
    ): Promise<Run>;

    get(
        runId: string,
    ): Promise<Run | undefined>;

    listRunsByChatId(
        chatId: string,
    ): Promise<Run[]>;

    updateStatus(
        runId: string,
        status: RunStatus,
    ): Promise<boolean>;

    delete(
        runId: string,
    ): Promise<boolean>;
}

export const runRepository = {
    create(
        chatId: string,
    ) {
        return createRun(
            `run_${randomUUID()}`,
            chatId,
        );
    },

    get: getRun,

    listRunsByChatId,

    updateStatus:
        updateRunStatus,

    delete: deleteRun,
} satisfies RunRepository;