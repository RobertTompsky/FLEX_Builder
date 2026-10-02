import {
    action,
    atom,
    computed,
    withAsync,
    wrap,
    type Atom,
} from "@reatom/core";

import type {
    AgentSSEMessage,
} from "@flex-builder/shared/agent";

import type {
    RunStatus,
    StartRunBody,
} from "@flex-builder/shared/run";

import type {
    UIMessage,
} from "@flex-builder/shared/chat";

import {
    runsApi,
} from "../../api/runs";

import {
    toolCallsApi,
} from "../../api/toolCalls";


type RunModelStatus = | "idle" | RunStatus;

type RunBody = Omit<StartRunBody, "query">;


type StartRunInput = {
    body: RunBody;
    query: string | null;
};

type CreateRunModelInput = {
    agentId: string;
    chatId: string;
    messages: Atom<UIMessage[]>;
};

export function createRunModel({
    agentId,
    chatId,
    messages,
}: CreateRunModelInput) {

    const events = atom<AgentSSEMessage[]>(
        [],
        `chats.${chatId}.run.events`,
    );


    let currentBody: RunBody | null = null;


    const latestStatusEvent = computed(
        () => {
            return events()
                .findLast(
                    (
                        event,
                    ): event is Extract<
                        AgentSSEMessage,
                        {
                            event:
                            "status";
                        }
                    > =>
                        event.event ===
                        "status",
                ) ?? null;
        },
        `chats.${chatId}.run.latestStatus`,
    );

    const id = computed(
        () =>
            latestStatusEvent()
                ?.data
                .data
                .runId ??
            null,

        `chats.${chatId}.run.id`,
    );

    const status = computed(
        (): RunModelStatus =>
            latestStatusEvent()
                ?.data
                .data
                .status ??
            "idle",

        `chats.${chatId}.run.status`,
    );


    const appendEvent = (
        event: AgentSSEMessage,
    ): void => {

        events.set(current => [...current, event]);

        applyMessageEvent(
            messages,
            event,
        );
    };

    const execute = async ({
        body,
        query,
    }: StartRunInput): Promise<void> => {
        await wrap(
            runsApi.start({
                params: {
                    agentId,
                    chatId,
                },
                body: {
                    ...body,
                    query,
                },
                options: {
                    onEvent:
                        appendEvent,
                },
            }),
        );
    };

    const start = action(
        async ({
            body,
            query,
        }: StartRunInput): Promise<void> => {
            const currentStatus = status();

            if (
                currentStatus ===
                "running" ||
                currentStatus ===
                "paused"
            ) {
                throw new Error(
                    "Run is already active",
                );
            }

            if (
                currentStatus ===
                "completed" ||
                currentStatus ===
                "stopped" ||
                currentStatus ===
                "failed"
            ) {
                events.set([]);
            }

            currentBody =
                body;

            if (query !== null) {
                messages.set(
                    (current) => [
                        ...current,
                        {
                            role: "user",
                            content: query,
                            status: "completed",
                        },
                    ],
                );
            }

            await execute({
                body,
                query,
            });
        },
        `chats.${chatId}.run.start`,
    ).extend(
        withAsync(),
    );

    const resume = action(
        async (
            approvedToolCallIds: string[],
        ): Promise<void> => {
            if (status() !== "paused"
            ) {
                throw new Error(
                    "Run is not paused",
                );
            }

            if (!currentBody) {
                throw new Error(
                    "Run body is missing",
                );
            }

            await wrap(
                toolCallsApi.approve({
                    params: {
                        chatId,
                    },
                    body: {
                        approvedToolCallIds,
                    },
                }),
            );

            await execute({
                body: currentBody,
                query: null,
            });
        },
        `chats.${chatId}.run.resume`,
    ).extend(
        withAsync(),
    );


    const stop = action(
        async (): Promise<void> => {

            const runId = id();

            if (!runId) {
                throw new Error(
                    "Run ID is missing",
                );
            }

            await wrap(
                runsApi.stop({
                    params: {
                        agentId,
                        chatId,
                        runId,
                    },
                    options: {
                        onEvent: appendEvent,
                    },
                }),
            );
        },

        `chats.${chatId}.run.stop`,
    ).extend(
        withAsync(),
    );


    return {
        id,
        events,
        status,

        start,
        resume,
        stop,
    };
}


export type RunModel =
    ReturnType<
        typeof createRunModel
    >;


function applyMessageEvent(
    messages: Atom<UIMessage[]>,
    event: AgentSSEMessage,
): void {

    switch (event.event) {

        case "text_delta": {
            const {
                delta,
            } = event.data.data;


            messages.set(
                current => {
                    const last = current.at(-1);

                    if (
                        last?.role ===
                        "assistant" &&
                        last.status ===
                        "in_progress"
                    ) {
                        return [
                            ...current.slice(
                                0,
                                -1,
                            ),

                            {
                                ...last,
                                content: last.content + delta,
                            },
                        ];
                    }

                    return [
                        ...current,

                        {
                            role: "assistant",
                            content: delta,
                            status: "in_progress",
                        },
                    ];
                },
            );

            break;
        }


        case "text_end": {
            messages.set(
                current =>
                    finishLastAssistant(
                        current,
                        "completed",
                    ),
            );

            break;
        }


        case "status": {
            const {
                status,
            } = event.data.data;

            if (
                status !== "stopped" &&
                status !== "failed"
            ) {
                break;
            }

            messages.set(
                current =>
                    finishLastAssistant(
                        current,
                        "incomplete",
                    ),
            );

            break;
        }
    }
}

function finishLastAssistant(
    messages: UIMessage[],
    status: | "completed" | "incomplete",
): UIMessage[] {
    const last = messages.at(-1);

    if (
        last?.role !==
        "assistant" ||
        last.status !==
        "in_progress"
    ) {
        return messages;
    }

    return [
        ...messages.slice(
            0,
            -1,
        ),

        {
            ...last,
            status,
        },
    ];
}