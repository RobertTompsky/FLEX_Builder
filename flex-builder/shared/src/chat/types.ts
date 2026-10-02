export type Chat = {
  id: string;
  title: string | null;
  createdAt: number;
  updatedAt: number;
};

export type UIMessage = {
    role: "assistant" | "user";
    content: string;
    status?: "in_progress" | "completed" | "incomplete";
};