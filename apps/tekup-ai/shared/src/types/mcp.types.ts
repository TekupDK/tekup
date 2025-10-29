export interface McpServer {
  id: string
  name: string
  displayName: string
  description: string | null
  type: 'http' | 'stdio'
  config: McpHttpConfig | McpStdioConfig
  isPublic: boolean
  isActive: boolean
  version: string | null
  icon: string | null
  category: string | null
  createdAt: Date
  updatedAt: Date
}

export interface McpHttpConfig {
  url: string
  headers?: Record<string, string>
}

export interface McpStdioConfig {
  command: string
  args: string[]
  env?: Record<string, string>
}

export interface McpTool {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

export interface McpToolCall {
  toolName: string
  arguments: Record<string, any>
  server: string
}

export interface McpToolResult {
  toolName: string
  result: any
  error?: string
  server: string
}
