export type AgentIdentity = {
    id: string;
    name: string;
};

export type Emit<E> = (ev: E) => void | Promise<void>