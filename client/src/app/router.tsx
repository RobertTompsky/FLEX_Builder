import { createBrowserRouter } from "react-router";
import { WorkspaceLayout } from "../layouts/WorkspaceLayout";
import { HomePage } from "../pages/HomePage";
import { AgentPage } from "../pages/AgentPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export const router = createBrowserRouter([
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
            },
            {
                path: "*",
                Component: NotFoundPage,
            },
        ],
    },
]);