import { z } from 'zod'

export const MemoryCategorySchema = z.enum([
  'preference',
  'fact',
  'instruction',
  'context',
  'general',
])

export const MemorySourceSchema = z.enum(['user_told', 'system_inferred', 'imported'])

export const CreateMemorySchema = z.object({
  category: MemoryCategorySchema.optional(),
  content: z.string().min(1).max(5000),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.string().datetime().or(z.date()).optional(),
  priority: z.number().int().min(1).max(10).optional(),
})

export const UpdateMemorySchema = z.object({
  category: MemoryCategorySchema.optional(),
  content: z.string().min(1).max(5000).optional(),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.string().datetime().or(z.date()).nullable().optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().min(1).max(10).optional(),
})

export type CreateMemoryInput = z.infer<typeof CreateMemorySchema>
export type UpdateMemoryInput = z.infer<typeof UpdateMemorySchema>
