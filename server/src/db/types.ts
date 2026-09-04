import { Generated } from "kysely";

export interface Agents {
    id: string;
    name: string;
    model: string;
    prompt: string;
    max_turns: number;
    pre_tool_use: "allow" | "ask" | "deny";
    created_at: Generated<number>;
    updated_at: Generated<number>;
}

export interface AgentCapabilities {
    agent_id: string;
    capability_id: string;
    access: "execute" | "orchestrate" | "both";
}

export interface Chats {
    id: string;
    title: string | null;
    created_at: Generated<number>;
    updated_at: Generated<number>;
}

export interface ChatItems {
    id: Generated<number>;
    chat_id: string;
    payload: string;
    created_at: Generated<number>;
}

export interface AgentChats {
    agent_id: string;
    chat_id: string;
}

export interface DB {
    agents: Agents;
    agent_capabilities: AgentCapabilities;
    chats: Chats;
    chat_items: ChatItems;
    agent_chats: AgentChats;
}