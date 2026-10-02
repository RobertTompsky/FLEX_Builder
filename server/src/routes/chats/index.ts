import Elysia from "elysia";
import { getChatItemsRoute } from "./getChatItems";
import { RouteDeps } from "../types";
import { getChatRoute } from "./getChat";
import { getChatRunsRoute } from "./getChatRuns";
import { approveToolCallsRoute } from "./approveToolcalls";
import { deleteChatRoute } from "./deleteChat";

type ChatRouteDeps = Pick<RouteDeps, 'chatRepository' | 'runRepository' | "workspaceStore">

export function chatRoutes(
    deps: ChatRouteDeps,
) {
    const {
        chatRepository,
        runRepository,
        workspaceStore
    } = deps;

    return new Elysia({
        prefix: "/chats",
    })
        .use(getChatItemsRoute({ chatRepository }))
        .use(getChatRunsRoute({ runRepository }))
        .use(getChatRoute({ chatRepository }))
        .use(approveToolCallsRoute({ chatRepository }))
        .use(
            deleteChatRoute({
                chatRepository,
                workspaceStore,
            }),
        )
}