import Elysia from "elysia";
import { approveToolCallsRoute } from "./approveToolcalls";
import { getChatItemsRoute } from "./getChatItems";
import { RouteDeps } from "../types";
import { getChatRoute } from "./getChat";
import { getChatRunsRoute } from "./getChatRuns";

type ChatRouteDeps = Pick<RouteDeps, 'chatRepository' | "runRepository">

export function chatRoutes(
    deps: ChatRouteDeps,
) {
    const {
        chatRepository,
        runRepository
    } = deps;

    return new Elysia({
        prefix: "/chats",
    })
        .use(approveToolCallsRoute({ chatRepository }))
        .use(getChatItemsRoute({ chatRepository }))
        .use(getChatRoute({ chatRepository }))
        .use(getChatRunsRoute({ runRepository }))
}