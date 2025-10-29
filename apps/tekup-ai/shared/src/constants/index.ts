export const AI_MODELS = {
  CLAUDE_35_SONNET: 'claude-3-5-sonnet-20241022',
  CLAUDE_3_OPUS: 'claude-3-opus-20240229',
  CLAUDE_3_HAIKU: 'claude-3-haiku-20240307',
  GPT_4_TURBO: 'gpt-4-turbo-preview',
  GPT_4: 'gpt-4',
} as const

export const DEFAULT_SETTINGS = {
  MODEL: AI_MODELS.CLAUDE_35_SONNET,
  TEMPERATURE: 0.7,
  MAX_TOKENS: 4096,
  MAX_MEMORIES: 25,
  ENABLE_MEMORY: true,
} as const

export const MEMORY_CATEGORIES = {
  PREFERENCE: 'preference',
  FACT: 'fact',
  INSTRUCTION: 'instruction',
  CONTEXT: 'context',
  GENERAL: 'general',
} as const

export const MCP_SERVER_TYPES = {
  HTTP: 'http',
  STDIO: 'stdio',
} as const

export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const

export const WEBSOCKET_EVENTS = {
  CHAT_MESSAGE: 'chat:message',
  CHAT_STREAM: 'chat:stream',
  CHAT_COMPLETE: 'chat:complete',
  CHAT_ERROR: 'chat:error',
  CONVERSATION_UPDATED: 'conversation:updated',
  MEMORY_CREATED: 'memory:created',
  MEMORY_UPDATED: 'memory:updated',
  MEMORY_DELETED: 'memory:deleted',
} as const
