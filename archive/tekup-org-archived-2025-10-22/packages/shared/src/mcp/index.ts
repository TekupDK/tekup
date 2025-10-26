export interface MCPServer {
  id: string;
  name: string;
  version: string;
  description?: string;
  capabilities: MCPCapabilities;
  transport: MCPTransport;
  status: MCPServerStatus;
  config: MCPServerConfig;
  metadata?: Record<string, any>;
}

export interface MCPCapabilities {
  tools?: MCPToolCapability[];
  resources?: MCPResourceCapability[];
  prompts?: MCPPromptCapability[];
  sampling?: boolean;
  logging?: MCPLoggingLevel[];
}

export interface MCPToolCapability {
  name: string;
  description?: string;
  inputSchema: MCPSchema;
  outputSchema?: MCPSchema;
}

export interface MCPResourceCapability {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPromptCapability {
  name: string;
  description?: string;
  arguments?: MCPPromptArgument[];
}

export interface MCPPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

export interface MCPSchema {
  type: string;
  properties?: Record<string, MCPSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface MCPSchemaProperty {
  type: string;
  description?: string;
  enum?: any[];
  items?: MCPSchema;
  properties?: Record<string, MCPSchemaProperty>;
}

export interface MCPTransport {
  type: 'stdio' | 'sse' | 'websocket' | 'http';
  config: MCPTransportConfig;
}

export interface MCPTransportConfig {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export type MCPServerStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'disabled';

export type MCPLoggingLevel = 'debug' | 'info' | 'notice' | 'warning' | 'error' | 'critical' | 'alert' | 'emergency';

export interface MCPServerConfig {
  autoStart?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  healthCheckInterval?: number;
  requestTimeout?: number;
  maxConcurrentRequests?: number;
}

export interface MCPMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: MCPError;
}

export interface MCPRequest extends MCPMessage {
  method: string;
  params?: any;
}

export interface MCPResponse extends MCPMessage {
  result?: any;
  error?: MCPError;
}

export interface MCPNotification extends MCPMessage {
  method: string;
  params?: any;
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

export interface MCPToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  serverId: string;
}

export interface MCPToolResult {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
  metadata?: {
    executionTime?: number;
    tokensUsed?: number;
    cost?: number;
  };
}

export interface MCPResourceRequest {
  uri: string;
  serverId: string;
}

export interface MCPResourceResponse {
  uri: string;
  content: string | ArrayBuffer;
  mimeType?: string;
  metadata?: Record<string, any>;
}

export interface MCPPromptRequest {
  name: string;
  arguments?: Record<string, any>;
  serverId: string;
}

export interface MCPPromptResponse {
  name: string;
  prompt: string;
  metadata?: Record<string, any>;
}

export interface MCPPlugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  servers: MCPServer[];
  dependencies?: Record<string, string>;
  config?: Record<string, any>;
  enabled: boolean;
  installedAt: Date;
  updatedAt?: Date;
}

export interface MCPPluginManifest {
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  main: string;
  servers: MCPServerManifest[];
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  config?: MCPPluginConfigSchema;
}

export interface MCPServerManifest {
  id: string;
  name: string;
  description?: string;
  transport: MCPTransport;
  capabilities: MCPCapabilities;
  config?: MCPServerConfig;
}

export interface MCPPluginConfigSchema {
  type: 'object';
  properties: Record<string, MCPSchemaProperty>;
  required?: string[];
}

export interface MCPRegistry {
  plugins: MCPRegistryPlugin[];
  lastUpdated: Date;
  version: string;
}

export interface MCPRegistryPlugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  downloadUrl: string;
  checksum?: string;
  size?: number;
  downloads?: number;
  rating?: number;
  reviews?: number;
  publishedAt: Date;
  updatedAt?: Date;
}

export type MCPEventType = 
  | 'server_connected'
  | 'server_disconnected'
  | 'server_error'
  | 'tool_called'
  | 'tool_completed'
  | 'resource_accessed'
  | 'prompt_requested'
  | 'plugin_installed'
  | 'plugin_uninstalled'
  | 'plugin_enabled'
  | 'plugin_disabled'
  | 'plugin_updated';

export interface MCPEvent {
  type: MCPEventType;
  serverId?: string;
  pluginId?: string;
  timestamp: Date;
  data?: any;
}

export interface MCPConfig {
  enabled: boolean;
  pluginDirectory: string;
  registryUrl: string;
  autoUpdate: boolean;
  updateCheckInterval: number;
  maxConcurrentServers: number;
  defaultTimeout: number;
  logging: {
    level: MCPLoggingLevel;
    file?: string;
    maxSize?: number;
    maxFiles?: number;
  };
  security: {
    allowUnsignedPlugins: boolean;
    trustedAuthors: string[];
    blockedPlugins: string[];
    sandboxMode: boolean;
  };
}

// Re-export centralized configuration types
export * from './configuration';

