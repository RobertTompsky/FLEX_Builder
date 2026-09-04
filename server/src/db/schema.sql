PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT '',
    prompt TEXT NOT NULL DEFAULT '',
    max_turns INTEGER NOT NULL DEFAULT 3,
    pre_tool_use TEXT NOT NULL DEFAULT 'allow'
        CHECK (pre_tool_use IN ('allow', 'ask', 'deny')),
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS agent_capabilities (
    agent_id TEXT NOT NULL,
    capability_id TEXT NOT NULL,
    access TEXT NOT NULL
        CHECK (access IN ('execute', 'orchestrate', 'both')),

    PRIMARY KEY (agent_id, capability_id),

    FOREIGN KEY (agent_id)
        REFERENCES agents(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    title TEXT,
    created_at INTEGER NOT NULL
        DEFAULT (unixepoch() * 1000),
    updated_at INTEGER NOT NULL
        DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS chat_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),

    FOREIGN KEY (chat_id)
        REFERENCES chats(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS chat_items_chat_id_idx
ON chat_items (chat_id, id);

CREATE TABLE IF NOT EXISTS agent_chats (
    agent_id TEXT NOT NULL,
    chat_id TEXT NOT NULL UNIQUE,

    PRIMARY KEY (agent_id, chat_id),

    FOREIGN KEY (agent_id)
        REFERENCES agents(id)
        ON DELETE CASCADE,

    FOREIGN KEY (chat_id)
        REFERENCES chats(id)
        ON DELETE CASCADE
);