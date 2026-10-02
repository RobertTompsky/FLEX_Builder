import {
    createBrowserRouter,
} from "react-router";

import {
    WorkspaceLayout,
} from "../layouts/WorkspaceLayout";

import {
    HomePage,
} from "../pages/HomePage";

import {
    AgentPage,
} from "../pages/AgentPage";

import {
    ChatPage,
} from "../pages/ChatPage";

import {
    NotFoundPage,
} from "../pages/NotFoundPage";

export const router =
    createBrowserRouter([
        {
            path: "/",
            Component: WorkspaceLayout,
            children: [
                {
                    index: true,
                    Component: HomePage,
                },

                {
                    path: "agents/:agentId",
                    Component: AgentPage,

                    children: [
                        {
                            path: "chats/:chatId",
                            Component: ChatPage,
                        },
                    ],
                },
                {
                    path: "*",
                    Component: NotFoundPage,
                },
            ],
        },
    ]);