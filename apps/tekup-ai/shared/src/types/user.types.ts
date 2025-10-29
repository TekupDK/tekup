export interface User {
  id: string
  email: string
  name: string | null
  supabaseUserId: string
  createdAt: Date
  updatedAt: Date
}

export interface UserSettings {
  id: string
  userId: string
  defaultModel: string
  systemPrompt: string | null
  temperature: number
  maxTokens: number
  enableMemory: boolean
  maxMemories: number
  enabledMcpServers: string[]
  uiPreferences: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface UsageStats {
  id: string
  userId: string
  date: Date
  messagesCount: number
  tokensUsed: number
  toolCallsCount: number
  cost: number
  createdAt: Date
}
