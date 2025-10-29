export interface Conversation {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  archived: boolean
  metadata: Record<string, any>
  messages?: Message[]
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
  createdAt: Date
  tokens: number | null
  model: string | null
  metadata: Record<string, any>
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface ToolResult {
  tool_call_id: string
  output: string
}

export interface StreamChunk {
  type: 'content' | 'tool_use' | 'tool_result' | 'complete' | 'error'
  content?: string
  toolName?: string
  toolInput?: any
  toolOutput?: any
  error?: string
}

export interface ChatRequest {
  conversationId?: string
  message: string
  model?: string
  temperature?: number
  maxTokens?: number
}

export interface ChatResponse {
  conversationId: string
  message: Message
}
