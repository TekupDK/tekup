import { z } from 'zod'

export const UpdateUserSettingsSchema = z.object({
  defaultModel: z.string().optional(),
  systemPrompt: z.string().nullable().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(8192).optional(),
  enableMemory: z.boolean().optional(),
  maxMemories: z.number().int().min(1).max(100).optional(),
  enabledMcpServers: z.array(z.string()).optional(),
  uiPreferences: z.record(z.any()).optional(),
})

export const CreateSavedPromptSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  prompt: z.string().min(1).max(10000),
  category: z.string().max(50).optional(),
  isPublic: z.boolean().optional(),
})

export type UpdateUserSettingsInput = z.infer<typeof UpdateUserSettingsSchema>
export type CreateSavedPromptInput = z.infer<typeof CreateSavedPromptSchema>
