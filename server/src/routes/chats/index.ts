import Elysia from "elysia";
import { approveToolCallsRoute } from "./approveToolcalls";
import { getConversationItemsRoute } from "./getChatItems";
import { RouteDeps } from "../types";

type ChatRouteDeps = Pick<RouteDeps, 'chatRepository'>

export function chatRoutes(
    deps: ChatRouteDeps,
) {
    const {
        chatRepository
    } = deps;

    return new Elysia({
        prefix: "/chats",
    })
        .use(approveToolCallsRoute({ chatRepository }))
        .use(getConversationItemsRoute({ chatRepository }))
}