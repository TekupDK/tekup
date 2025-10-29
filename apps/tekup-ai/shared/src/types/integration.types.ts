export interface Integration {
  id: string
  userId: string
  type: 'mcp_http' | 'mcp_stdio' | 'oauth_service'
  name: string
  config: Record<string, any>
  isActive: boolean
  lastUsedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface SavedPrompt {
  id: string
  userId: string
  name: string
  description: string | null
  prompt: string
  category: string | null
  isPublic: boolean
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateIntegrationDto {
  type: Integration['type']
  name: string
  config: Record<string, any>
}

export interface CreateSavedPromptDto {
  name: string
  description?: string
  prompt: string
  category?: string
  isPublic?: boolean
}
