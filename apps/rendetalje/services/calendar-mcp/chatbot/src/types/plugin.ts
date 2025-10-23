// MCP Plugin System Types
export interface MCPPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  icon: string;
  status: 'active' | 'inactive' | 'error' | 'loading';
  server: {
    url: string;
    health: boolean;
    lastPing: Date;
  };
  tools: MCPTool[];
  config: PluginConfig;
  metadata: PluginMetadata;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
  category: string;
  icon: string;
  pluginId: string;
}

export interface PluginConfig {
  autoConnect: boolean;
  retryAttempts: number;
  timeout: number;
  rateLimit: number;
  enabled: boolean;
}

export interface PluginMetadata {
  installedAt: Date;
  lastUsed: Date;
  usageCount: number;
  errorCount: number;
  tags: string[];
}

export interface PluginRegistry {
  plugins: MCPPlugin[];
  activePlugins: string[];
  defaultPlugins: string[];
  categories: PluginCategory[];
}

export interface PluginCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  plugins: string[];
}

// Plugin Discovery
export interface PluginDiscovery {
  scanLocal(): Promise<MCPPlugin[]>;
  scanNetwork(): Promise<MCPPlugin[]>;
  validatePlugin(plugin: MCPPlugin): Promise<boolean>;
  installPlugin(plugin: MCPPlugin): Promise<void>;
  uninstallPlugin(pluginId: string): Promise<void>;
}

// Plugin Manager
export interface PluginManager {
  loadPlugin(plugin: MCPPlugin): Promise<void>;
  unloadPlugin(pluginId: string): Promise<void>;
  executeTool(pluginId: string, toolName: string, input: any): Promise<any>;
  getAvailableTools(): MCPTool[];
  getPluginStatus(pluginId: string): PluginStatus;
  restartPlugin(pluginId: string): Promise<void>;
}

export interface PluginStatus {
  connected: boolean;
  lastError?: string;
  responseTime: number;
  toolsAvailable: number;
  healthScore: number;
}
