export interface Memory {
  id: string
  userId: string
  category: 'preference' | 'fact' | 'instruction' | 'context' | 'general'
  content: string
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
  expiresAt: Date | null
  isActive: boolean
  source: 'user_told' | 'system_inferred' | 'imported'
  priority: number
}

export interface CreateMemoryDto {
  category?: Memory['category']
  content: string
  metadata?: Record<string, any>
  expiresAt?: Date
  priority?: number
}

export interface UpdateMemoryDto {
  category?: Memory['category']
  content?: string
  metadata?: Record<string, any>
  expiresAt?: Date | null
  isActive?: boolean
  priority?: number
}
