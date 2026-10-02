import z from "zod"

export const ChatParamsSchema = z.object({
    chatId: z.string().min(1),
})

export type ChatParams =
    z.infer<
        typeof ChatParamsSchema
    >;

export const CreateChatBodySchema = z.object({
    name: z.string().min(1)
})

export type CreateChatBody = z.infer<typeof CreateChatBodySchema>