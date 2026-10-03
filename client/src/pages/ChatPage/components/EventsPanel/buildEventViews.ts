import type {
    AgentEvent,
    AgentIdentity,
    AgentSSEMessage,
} from "@flex-builder/shared/agent";

export type ArtifactSSEEvent = Extract<
    AgentSSEMessage,
    {
        event:
        | "artifact_read"
        | "artifact_created";
    }
>;

export type ExecutionSSEEvent = Extract<
    AgentSSEMessage,
    {
        event:
        | "started"
        | "timeout"
        | "output_exceeded"
        | "exit"
        | "rpc_trace";
    }
>;


export type ToolStatus =
    | "pending"
    | "running"
    | "completed"
    | "error";


export type ArtifactView = {
    kind: "artifact";
    order: number;
    event: ArtifactSSEEvent;
};


export type ExecutionView = {
    kind: "execution";

    order: number;

    event: ExecutionSSEEvent;
};


export type SubagentToolView = {
    id: string;
    callId: string;
    name: string;

    args?: string;
    result?: string;
    error?: string;

    status:
    ToolStatus;
};


export type ResponseStatus =
    | "in_progress"
    | "completed"
    | "incomplete"
    | null;


export type SubagentView = {
    kind: "subagent";

    order: number;

    runId: string;

    subagent:
    AgentIdentity;

    events:
    AgentEvent[];

    tools:
    SubagentToolView[];

    response:
    string;

    responseStatus:
    ResponseStatus;
};


export type NestedView =
    | ArtifactView
    | ExecutionView
    | SubagentView;


export type ToolView = {
    kind: "tool";

    id: string;
    callId: string;
    name: string;

    args?: string;
    result?: string;
    error?: string;

    status:
    ToolStatus;

    nested:
    NestedView[];
};


export type BaseEventView = {
    kind: "event";

    event:
    AgentSSEMessage;
};


export type EventView =
    | ToolView
    | BaseEventView;


type RawSubagentGroup = {
    order: number;

    runId: string;

    subagent:
    AgentIdentity;

    events:
    AgentEvent[];
};


type EventCollections = {
    argsById:
    Map<string, string>;

    resultsByCallId:
    Map<string, string>;

    errorsByCallId:
    Map<string, string>;

    statusByCallId:
    Map<string, ToolStatus>;

    artifactsByCallId:
    Map<
        string,
        ArtifactView[]
    >;

    executionsByCallId:
    Map<
        string,
        ExecutionView[]
    >;

    subagentsByCallId:
    Map<
        string,
        Map<
            string,
            RawSubagentGroup
        >
    >;
};


function appendMapValue(
    map:
        Map<string, string>,

    key:
        string,

    value:
        string,
): void {
    map.set(
        key,
        (
            map.get(key) ??
            ""
        ) + value,
    );
}


function buildSubagentTools(
    events:
        AgentEvent[],
): SubagentToolView[] {
    const argsById =
        new Map<
            string,
            string
        >();

    const resultsByCallId =
        new Map<
            string,
            string
        >();

    const errorsByCallId =
        new Map<
            string,
            string
        >();

    const statusByCallId =
        new Map<
            string,
            ToolStatus
        >();


    for (const event of events) {
        switch (event.event) {

            case "arguments_delta": {
                const {
                    id,
                    delta,
                } = event.data;

                appendMapValue(
                    argsById,
                    id,
                    delta,
                );

                break;
            }


            case "tool_call": {
                const {
                    argsId,
                    args,
                } = event.data;

                argsById.set(
                    argsId,
                    args,
                );

                break;
            }


            case "tool_start": {
                statusByCallId.set(
                    event.data.callId,
                    "running",
                );

                break;
            }


            case "tool_result": {
                const {
                    callId,
                    outputPreview,
                } = event.data;

                statusByCallId.set(
                    callId,
                    "completed",
                );

                resultsByCallId.set(
                    callId,
                    outputPreview ??
                    "",
                );

                break;
            }


            case "tool_error": {
                const {
                    callId,
                    message,
                } = event.data;

                statusByCallId.set(
                    callId,
                    "error",
                );

                errorsByCallId.set(
                    callId,
                    message,
                );

                break;
            }
        }
    }

    const tools: SubagentToolView[] = [];

    const rendered = new Set<string>();

    for (const event of events) {
        if (
            event.event !==
            "output_item.added"
        ) {
            continue;
        }

        const {
            id,
            callId,
            name,
        } = event.data;

        if (rendered.has(callId)) {
            continue;
        }

        rendered.add(callId);

        tools.push({
            id,
            callId,
            name,
            args: argsById.get(id),

            result: resultsByCallId.get(callId),

            error: errorsByCallId.get(callId),

            status: statusByCallId.get(callId) ?? "pending",
        });
    }

    return tools;
}


function buildSubagentView(
    group: RawSubagentGroup,
): SubagentView {
    let response = "";

    let responseStatus: ResponseStatus = null;

    for (const event of group.events) {
        switch (event.event) {

            case "text_delta": {
                response += event.data.delta;
                responseStatus = "in_progress";

                break;
            }


            case "text_end": {
                if (!response) {
                    response = event.data.fullText;
                }

                responseStatus = "completed";

                break;
            }


            case "llm_error": {
                if (response) {
                    responseStatus = "incomplete";
                }

                break;
            }
        }
    }


    return {
        kind: "subagent",

        order: group.order,

        runId: group.runId,

        subagent: group.subagent,

        events: group.events,

        tools: buildSubagentTools(group.events),

        response,
        responseStatus,
    };
}


function collectEventData(
    events: AgentSSEMessage[],
): EventCollections {
    const argsById = new Map<string, string>();

    const resultsByCallId = new Map<string, string>();

    const errorsByCallId = new Map<
        string,
        string
    >();

    const statusByCallId = new Map<
        string,
        ToolStatus
    >();

    const artifactsByCallId = new Map<
        string,
        ArtifactView[]
    >();

    const executionsByCallId = new Map<
        string,
        ExecutionView[]
    >();

    const subagentsByCallId = new Map<
        string,
        Map<
            string,
            RawSubagentGroup
        >
    >();


    for (
        let index = 0;
        index < events.length;
        index++
    ) {
        const event = events[index];

        if (!event) {
            continue;
        }


        switch (event.event) {

            case "arguments_delta": {
                const {
                    id,
                    delta,
                } = event.data.data;

                appendMapValue(
                    argsById,
                    id,
                    delta,
                );

                break;
            }


            case "tool_call": {
                const {
                    argsId,
                    args,
                } = event.data.data;

                argsById.set(
                    argsId,
                    args,
                );

                break;
            }


            case "tool_start": {
                statusByCallId.set(
                    event
                        .data
                        .data
                        .callId,

                    "running",
                );

                break;
            }


            case "tool_result": {
                const {
                    callId,
                    outputPreview,
                } = event.data.data;

                statusByCallId.set(
                    callId,
                    "completed",
                );

                resultsByCallId.set(
                    callId,
                    outputPreview ??
                    "",
                );

                break;
            }


            case "tool_error": {
                const {
                    callId,
                    message,
                } = event.data.data;

                statusByCallId.set(
                    callId,
                    "error",
                );

                errorsByCallId.set(
                    callId,
                    message,
                );

                break;
            }


            case "artifact_read":
            case "artifact_created": {
                const {
                    toolCallId,
                } = event.data.source;

                const artifacts = artifactsByCallId.get(toolCallId) ?? [];

                artifacts.push({
                    kind: "artifact",
                    order: index,
                    event,
                });

                artifactsByCallId.set(
                    toolCallId,
                    artifacts,
                );

                break;
            }


            case "started":
            case "timeout":
            case "output_exceeded":
            case "exit":
            case "rpc_trace": {
                const {
                    toolCallId,
                } = event.data.source;

                const executions = executionsByCallId.get(toolCallId) ?? [];

                executions.push({
                    kind: "execution",
                    order: index,
                    event,
                });

                executionsByCallId.set(
                    toolCallId,
                    executions,
                );

                break;
            }


            case "subagent_event": {
                const {
                    subagentRunId,
                    event: subevent,
                } = event.data.data;

                const subagent = event.data.agent;

                const {
                    toolCallId,
                } =
                    event.data.source;


                let byRun = subagentsByCallId.get(toolCallId);

                if (!byRun) {
                    byRun = new Map();

                    subagentsByCallId.set(
                        toolCallId,
                        byRun,
                    );
                }


                let group = byRun.get(subagentRunId);

                if (!group) {
                    group = {
                        order: index,
                        runId: subagentRunId,
                        subagent,
                        events: [],
                    };

                    byRun.set(subagentRunId, group);
                }

                group.events.push(subevent,);

                break;
            }
        }
    }


    return {
        argsById,

        resultsByCallId,
        errorsByCallId,
        statusByCallId,

        artifactsByCallId,
        executionsByCallId,
        subagentsByCallId,
    };
}


export function getCurrentRoundEvents(
    events: AgentSSEMessage[],
): AgentSSEMessage[] {
    const latestStatus =
        events.findLast(
            (
                event,
            ): event is Extract<
                AgentSSEMessage,
                {
                    event: "status";
                }
            > =>
                event.event === "status",
        );

    if (
        !latestStatus ||
        latestStatus
            .data
            .data
            .status !==
        "paused"
    ) {
        return [];
    }


    for (
        let index = events.length - 1;
        index >= 0;
        index--
    ) {
        const event = events[index];

        if (
            event?.event === "status" &&
            event.data.data.status === "running"
        ) {
            return events.slice(index + 1);
        }
    }

    return events;
}

export function buildEventViews(
    events: AgentSSEMessage[],
): EventView[] {
    const {
        argsById,

        resultsByCallId,
        errorsByCallId,
        statusByCallId,

        artifactsByCallId,
        executionsByCallId,
        subagentsByCallId,
    } = collectEventData(events);

    const views: EventView[] = [];

    const renderedCalls = new Set<string>();

    for (const event of events) {
        switch (event.event) {
            /*
             * Эти события входят
             * в агрегированный ToolView.
             */
            case "arguments_delta":
            case "tool_call":
            case "tool_start":
            case "tool_result":
            case "tool_error":

            case "artifact_read":
            case "artifact_created":

            case "started":
            case "timeout":
            case "output_exceeded":
            case "exit":
            case "rpc_trace":

            case "subagent_event":

            /*
             * Текст основного агента
             * уже показывается в Chat.
             */
            case "text_delta":
            case "text_end":
                continue;

            case "output_item.added": {
                const {
                    id,
                    callId,
                    name,
                } = event.data.data;

                if (renderedCalls.has(callId)
                ) {
                    continue;
                }

                renderedCalls.add(callId);

                const artifacts = artifactsByCallId.get(callId) ?? [];

                const executions = executionsByCallId.get(callId) ?? [];

                const subagents = [
                    ...(
                        subagentsByCallId
                            .get(callId)
                            ?.values() ??
                        []
                    ),
                ].map(buildSubagentView);

                const nested: NestedView[] = [
                    ...artifacts,
                    ...executions,
                    ...subagents,
                ].sort(
                    (
                        left,
                        right,
                    ) =>
                        left.order -
                        right.order,
                );

                views.push({
                    kind: "tool",
                    id,
                    callId,
                    name,
                    args: argsById.get(id),
                    result: resultsByCallId.get(callId),
                    error: errorsByCallId.get(callId),
                    status: statusByCallId.get(callId) ?? "pending",
                    nested,
                });

                continue;
            }

            default:
                views.push({
                    kind: "event",
                    event,
                });
        }
    }


    return views;
}