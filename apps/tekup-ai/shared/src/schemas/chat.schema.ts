import { z } from 'zod'

export const ChatRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1, 'Message cannot be empty').max(10000),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(8192).optional(),
})

export const CreateConversationSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  metadata: z.record(z.any()).optional(),
})

export const UpdateConversationSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  archived: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
})

export type ChatRequestInput = z.infer<typeof ChatRequestSchema>
export type CreateConversationInput = z.infer<typeof CreateConversationSchema>
export type UpdateConversationInput = z.infer<typeof UpdateConversationSchema>
