import { MCPPlugin, MCPTool, PluginManager, PluginStatus } from '../types/plugin';

export class PluginManagerService implements PluginManager {
  private plugins: Map<string, MCPPlugin> = new Map();
  private activeConnections: Map<string, WebSocket> = new Map();
  private toolCache: Map<string, MCPTool[]> = new Map();

  constructor() {
    this.initializeDefaultPlugins();
  }

  private async initializeDefaultPlugins() {
    // Load default plugins from localStorage
    const savedPlugins = localStorage.getItem('mcp-plugins');
    if (savedPlugins) {
      const plugins: MCPPlugin[] = JSON.parse(savedPlugins);
      for (const plugin of plugins) {
        if (plugin.config.enabled) {
          await this.loadPlugin(plugin);
        }
      }
    }
  }

  async loadPlugin(plugin: MCPPlugin): Promise<void> {
    try {
      plugin.status = 'loading';
      
      // Test connection
      const health = await this.testConnection(plugin.server.url);
      if (!health) {
        throw new Error('Plugin server not responding');
      }

      // Load tools
      const tools = await this.loadPluginTools(plugin);
      plugin.tools = tools;
      plugin.status = 'active';
      plugin.server.health = true;
      plugin.server.lastPing = new Date();

      this.plugins.set(plugin.id, plugin);
      this.toolCache.set(plugin.id, tools);
      
      // Save to localStorage
      this.savePlugins();
      
      console.log(`✅ Plugin loaded: ${plugin.name}`);
    } catch (error) {
      plugin.status = 'error';
      plugin.server.health = false;
      console.error(`❌ Failed to load plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    // Close connection
    const connection = this.activeConnections.get(pluginId);
    if (connection) {
      connection.close();
      this.activeConnections.delete(pluginId);
    }

    // Remove from cache
    this.plugins.delete(pluginId);
    this.toolCache.delete(pluginId);
    
    // Save to localStorage
    this.savePlugins();
    
    console.log(`🔌 Plugin unloaded: ${plugin.name}`);
  }

  async executeTool(pluginId: string, toolName: string, input: any): Promise<any> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.status !== 'active') {
      throw new Error(`Plugin ${pluginId} is not active`);
    }

    try {
      const response = await fetch(`${plugin.server.url}/api/v1/tools/${toolName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Plugin-ID': pluginId,
          'X-Tool-Name': toolName
        },
        body: JSON.stringify(input)
      });

      if (!response.ok) {
        throw new Error(`Tool execution failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update plugin usage
      plugin.metadata.lastUsed = new Date();
      plugin.metadata.usageCount++;
      this.savePlugins();

      return result;
    } catch (error) {
      plugin.metadata.errorCount++;
      this.savePlugins();
      throw error;
    }
  }

  getAvailableTools(): MCPTool[] {
    const allTools: MCPTool[] = [];
    
    for (const [pluginId, tools] of this.toolCache) {
      const plugin = this.plugins.get(pluginId);
      if (plugin && plugin.status === 'active') {
        allTools.push(...tools);
      }
    }
    
    return allTools;
  }

  getPluginStatus(pluginId: string): PluginStatus {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return {
        connected: false,
        responseTime: 0,
        toolsAvailable: 0,
        healthScore: 0
      };
    }

    return {
      connected: plugin.status === 'active',
      lastError: plugin.status === 'error' ? 'Connection failed' : undefined,
      responseTime: this.calculateResponseTime(plugin),
      toolsAvailable: plugin.tools.length,
      healthScore: this.calculateHealthScore(plugin)
    };
  }

  async restartPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    await this.unloadPlugin(pluginId);
    await this.loadPlugin(plugin);
  }

  // Plugin Discovery
  async discoverPlugins(): Promise<MCPPlugin[]> {
    const discovered: MCPPlugin[] = [];
    
    // Scan for local MCP servers
    const localPlugins = await this.scanLocalServers();
    discovered.push(...localPlugins);
    
    // Scan for network MCP servers
    const networkPlugins = await this.scanNetworkServers();
    discovered.push(...networkPlugins);
    
    return discovered;
  }

  private async scanLocalServers(): Promise<MCPPlugin[]> {
    const localServers = [
      {
        id: 'renos-calendar-mcp',
        name: 'RenOS Calendar MCP',
        description: 'Kalender og booking management',
        version: '1.0.0',
        author: 'Tekup',
        icon: '📅',
        server: { url: 'http://localhost:3001', health: false, lastPing: new Date() },
        tools: [],
        config: { autoConnect: true, retryAttempts: 3, timeout: 5000, rateLimit: 100, enabled: true },
        metadata: { installedAt: new Date(), lastUsed: new Date(), usageCount: 0, errorCount: 0, tags: ['calendar', 'booking'] }
      },
      {
        id: 'tekup-billy-mcp',
        name: 'Tekup Billy MCP',
        description: 'Faktura og payment management',
        version: '1.0.0',
        author: 'Tekup',
        icon: '🧾',
        server: { url: 'http://localhost:3002', health: false, lastPing: new Date() },
        tools: [],
        config: { autoConnect: true, retryAttempts: 3, timeout: 5000, rateLimit: 100, enabled: true },
        metadata: { installedAt: new Date(), lastUsed: new Date(), usageCount: 0, errorCount: 0, tags: ['invoice', 'payment'] }
      }
    ];

    return localServers.map(server => ({
      ...server,
      status: 'inactive' as const
    }));
  }

  private async scanNetworkServers(): Promise<MCPPlugin[]> {
    // TODO: Implement network discovery
    return [];
  }

  private async testConnection(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  private async loadPluginTools(plugin: MCPPlugin): Promise<MCPTool[]> {
    try {
      const response = await fetch(`${plugin.server.url}/tools`);
      const data = await response.json();
      
      return data.tools.map((tool: any) => ({
        ...tool,
        pluginId: plugin.id
      }));
    } catch (error) {
      console.error(`Failed to load tools for plugin ${plugin.id}:`, error);
      return [];
    }
  }

  private calculateResponseTime(plugin: MCPPlugin): number {
    // Simple calculation based on last ping
    const now = new Date();
    const lastPing = plugin.server.lastPing;
    return now.getTime() - lastPing.getTime();
  }

  private calculateHealthScore(plugin: MCPPlugin): number {
    let score = 100;
    
    if (!plugin.server.health) score -= 50;
    if (plugin.metadata.errorCount > 0) score -= 20;
    if (plugin.status !== 'active') score -= 30;
    
    return Math.max(0, score);
  }

  private savePlugins(): void {
    const plugins = Array.from(this.plugins.values());
    localStorage.setItem('mcp-plugins', JSON.stringify(plugins));
  }

  // Get all plugins
  getAllPlugins(): MCPPlugin[] {
    return Array.from(this.plugins.values());
  }

  // Get active plugins
  getActivePlugins(): MCPPlugin[] {
    return Array.from(this.plugins.values()).filter(p => p.status === 'active');
  }

  // Get plugin by ID
  getPlugin(pluginId: string): MCPPlugin | undefined {
    return this.plugins.get(pluginId);
  }
}
