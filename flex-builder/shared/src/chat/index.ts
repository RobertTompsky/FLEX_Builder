import z from "zod"

export const ChatParamsSchema = z.object({
    chatId: z.string().min(1),
})

export type ConversationParams =
    z.infer<
        typeof ChatParamsSchema
    >;

export type Chat = {
  id: string;
  title: string | null;
  createdAt: number;
  updatedAt: number;
};