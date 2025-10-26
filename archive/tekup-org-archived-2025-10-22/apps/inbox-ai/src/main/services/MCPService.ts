import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import { 
  MCPServer, 
  MCPPlugin, 
  MCPConfig, 
  MCPMessage, 
  MCPRequest, 
  MCPResponse, 
  MCPToolCall, 
  MCPToolResult,
  MCPResourceRequest,
  MCPResourceResponse,
  MCPPromptRequest,
  MCPPromptResponse,
  MCPEvent,
  MCPServerStatus,
  MCPPluginManifest
} from '@tekup/shared';
import { LogService } from './LogService';

export class MCPService extends EventEmitter {
  private servers: Map<string, MCPServerInstance> = new Map();
  private plugins: Map<string, MCPPlugin> = new Map();
  private config: MCPConfig;
  private logService: LogService;
  private isInitialized = false;

  constructor(logService: LogService) {
    super();
    this.logService = logService;
    this.config = this.getDefaultConfig();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.logService.info('Initializing MCP Service');
      
      // Load configuration
      await this.loadConfig();
      
      // Create plugin directory if it doesn't exist
      await this.ensurePluginDirectory();
      
      // Load installed plugins
      await this.loadPlugins();
      
      // Start enabled servers
      await this.startEnabledServers();
      
      this.isInitialized = true;
      this.logService.info('MCP Service initialized successfully');
      
      this.emit('initialized');
    } catch (error) {
      this.logService.error('Failed to initialize MCP Service:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    this.logService.info('Shutting down MCP Service');
    
    // Stop all servers
    const shutdownPromises = Array.from(this.servers.values()).map(server => 
      this.stopServer(server.config.id)
    );
    
    await Promise.allSettled(shutdownPromises);
    
    this.servers.clear();
    this.plugins.clear();
    this.isInitialized = false;
    
    this.logService.info('MCP Service shut down');
  }

  // Plugin Management
  async installPlugin(pluginPath: string): Promise<MCPPlugin> {
    try {
      this.logService.info(`Installing plugin from: ${pluginPath}`);
      
      // Load plugin manifest
      const manifestPath = path.join(pluginPath, 'package.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest: MCPPluginManifest = JSON.parse(manifestContent);
      
      // Validate manifest
      this.validatePluginManifest(manifest);
      
      // Create plugin instance
      const plugin: MCPPlugin = {
        id: manifest.name,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        author: manifest.author,
        homepage: manifest.homepage,
        repository: manifest.repository,
        license: manifest.license,
        keywords: manifest.keywords,
        servers: manifest.servers.map(serverManifest => ({
          id: serverManifest.id,
          name: serverManifest.name,
          version: manifest.version,
          description: serverManifest.description,
          capabilities: serverManifest.capabilities,
          transport: serverManifest.transport,
          status: 'disconnected' as MCPServerStatus,
          config: serverManifest.config || {},
          metadata: { pluginId: manifest.name }
        })),
        dependencies: manifest.dependencies,
        config: {},
        enabled: true,
        installedAt: new Date(),
      };
      
      // Store plugin
      this.plugins.set(plugin.id, plugin);
      
      // Register servers
      for (const server of plugin.servers) {
        await this.registerServer(server);
      }
      
      this.logService.info(`Plugin ${plugin.name} installed successfully`);
      this.emitEvent('plugin_installed', { pluginId: plugin.id });
      
      return plugin;
    } catch (error) {
      this.logService.error(`Failed to install plugin from ${pluginPath}:`, error);
      throw error;
    }
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    try {
      this.logService.info(`Uninstalling plugin: ${pluginId}`);
      
      // Stop and unregister servers
      for (const server of plugin.servers) {
        await this.stopServer(server.id);
        this.servers.delete(server.id);
      }
      
      // Remove plugin
      this.plugins.delete(pluginId);
      
      this.logService.info(`Plugin ${pluginId} uninstalled successfully`);
      this.emitEvent('plugin_uninstalled', { pluginId });
    } catch (error) {
      this.logService.error(`Failed to uninstall plugin ${pluginId}:`, error);
      throw error;
    }
  }

  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.enabled = true;
    
    // Start servers
    for (const server of plugin.servers) {
      if (server.config.autoStart !== false) {
        await this.startServer(server.id);
      }
    }
    
    this.emitEvent('plugin_enabled', { pluginId });
  }

  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.enabled = false;
    
    // Stop servers
    for (const server of plugin.servers) {
      await this.stopServer(server.id);
    }
    
    this.emitEvent('plugin_disabled', { pluginId });
  }

  // Server Management
  async registerServer(server: MCPServer): Promise<void> {
    const instance = new MCPServerInstance(server, this.logService);
    this.servers.set(server.id, instance);
    
    // Set up event handlers
    instance.on('connected', () => {
      this.emitEvent('server_connected', { serverId: server.id });
    });
    
    instance.on('disconnected', () => {
      this.emitEvent('server_disconnected', { serverId: server.id });
    });
    
    instance.on('error', (error) => {
      this.emitEvent('server_error', { serverId: server.id, error });
    });
  }

  async startServer(serverId: string): Promise<void> {
    const instance = this.servers.get(serverId);
    if (!instance) {
      throw new Error(`Server ${serverId} not found`);
    }

    await instance.start();
  }

  async stopServer(serverId: string): Promise<void> {
    const instance = this.servers.get(serverId);
    if (!instance) {
      throw new Error(`Server ${serverId} not found`);
    }

    await instance.stop();
  }

  // Tool Execution
  async callTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
    const instance = this.servers.get(toolCall.serverId);
    if (!instance) {
      throw new Error(`Server ${toolCall.serverId} not found`);
    }

    const startTime = Date.now();
    
    try {
      this.emitEvent('tool_called', { 
        serverId: toolCall.serverId, 
        toolName: toolCall.name,
        arguments: toolCall.arguments
      });
      
      const result = await instance.callTool(toolCall);
      
      const executionTime = Date.now() - startTime;
      result.metadata = {
        ...result.metadata,
        executionTime
      };
      
      this.emitEvent('tool_completed', {
        serverId: toolCall.serverId,
        toolName: toolCall.name,
        success: result.success,
        executionTime
      });
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.emitEvent('tool_completed', {
        serverId: toolCall.serverId,
        toolName: toolCall.name,
        success: false,
        error: error.message,
        executionTime
      });
      
      throw error;
    }
  }

  // Resource Access
  async getResource(request: MCPResourceRequest): Promise<MCPResourceResponse> {
    const instance = this.servers.get(request.serverId);
    if (!instance) {
      throw new Error(`Server ${request.serverId} not found`);
    }

    this.emitEvent('resource_accessed', {
      serverId: request.serverId,
      uri: request.uri
    });
    
    return await instance.getResource(request);
  }

  // Prompt Templates
  async getPrompt(request: MCPPromptRequest): Promise<MCPPromptResponse> {
    const instance = this.servers.get(request.serverId);
    if (!instance) {
      throw new Error(`Server ${request.serverId} not found`);
    }

    this.emitEvent('prompt_requested', {
      serverId: request.serverId,
      promptName: request.name,
      arguments: request.arguments
    });
    
    return await instance.getPrompt(request);
  }

  // Getters
  getPlugins(): MCPPlugin[] {
    return Array.from(this.plugins.values());
  }

  getServers(): MCPServer[] {
    return Array.from(this.servers.values()).map(instance => instance.config);
  }

  getServerStatus(serverId: string): MCPServerStatus {
    const instance = this.servers.get(serverId);
    return instance ? instance.config.status : 'disconnected';
  }

  getConfig(): MCPConfig {
    return { ...this.config };
  }

  async updateConfig(newConfig: Partial<MCPConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    // Save config to file
    // Implementation depends on your config storage strategy
  }

  // Private methods
  private async loadConfig(): Promise<void> {
    // Load configuration from file or use defaults
    // Implementation depends on your config storage strategy
  }

  private async ensurePluginDirectory(): Promise<void> {
    try {
      await fs.access(this.config.pluginDirectory);
    } catch {
      await fs.mkdir(this.config.pluginDirectory, { recursive: true });
    }
  }

  private async loadPlugins(): Promise<void> {
    // Load plugins from plugin directory
    // Implementation depends on your plugin storage strategy
  }

  private async startEnabledServers(): Promise<void> {
    const startPromises = Array.from(this.plugins.values())
      .filter(plugin => plugin.enabled)
      .flatMap(plugin => plugin.servers)
      .filter(server => server.config.autoStart !== false)
      .map(server => this.startServer(server.id));
    
    await Promise.allSettled(startPromises);
  }

  private validatePluginManifest(manifest: MCPPluginManifest): void {
    if (!manifest.name) {
      throw new Error('Plugin manifest missing name');
    }
    if (!manifest.version) {
      throw new Error('Plugin manifest missing version');
    }
    if (!manifest.servers || manifest.servers.length === 0) {
      throw new Error('Plugin manifest missing servers');
    }
  }

  private emitEvent(type: string, data?: any): void {
    const event: MCPEvent = {
      type: type as any,
      timestamp: new Date(),
      ...data
    };
    
    this.emit('event', event);
  }

  private getDefaultConfig(): MCPConfig {
    return {
      enabled: true,
      pluginDirectory: path.join(process.cwd(), 'plugins'),
      registryUrl: 'https://registry.mcp.dev',
      autoUpdate: false,
      updateCheckInterval: 24 * 60 * 60 * 1000, // 24 hours
      maxConcurrentServers: 10,
      defaultTimeout: 30000,
      logging: {
        level: 'info',
        maxSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
      },
      security: {
        allowUnsignedPlugins: false,
        trustedAuthors: [],
        blockedPlugins: [],
        sandboxMode: true
      }
    };
  }
}

// MCP Server Instance
class MCPServerInstance extends EventEmitter {
  public config: MCPServer;
  private process?: ChildProcess;
  private logService: LogService;
  private messageId = 0;
  private pendingRequests = new Map<string | number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout: NodeJS.Timeout;
  }>();

  constructor(config: MCPServer, logService: LogService) {
    super();
    this.config = config;
    this.logService = logService;
  }

  async start(): Promise<void> {
    if (this.config.status === 'connected' || this.config.status === 'connecting') {
      return;
    }

    this.config.status = 'connecting';
    
    try {
      if (this.config.transport.type === 'stdio') {
        await this.startStdioTransport();
      } else {
        throw new Error(`Transport type ${this.config.transport.type} not implemented`);
      }
      
      this.config.status = 'connected';
      this.emit('connected');
    } catch (error) {
      this.config.status = 'error';
      this.emit('error', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.config.status === 'disconnected') {
      return;
    }

    this.config.status = 'disconnected';
    
    // Clear pending requests
    for (const [id, request] of this.pendingRequests) {
      clearTimeout(request.timeout);
      request.reject(new Error('Server stopped'));
    }
    this.pendingRequests.clear();
    
    // Kill process
    if (this.process) {
      this.process.kill();
      this.process = undefined;
    }
    
    this.emit('disconnected');
  }

  async callTool(toolCall: MCPToolCall): Promise<MCPToolResult> {
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: this.generateMessageId(),
      method: 'tools/call',
      params: {
        name: toolCall.name,
        arguments: toolCall.arguments
      }
    };

    const response = await this.sendRequest(request);
    
    return {
      id: toolCall.id,
      success: !response.error,
      result: response.result,
      error: response.error?.message
    };
  }

  async getResource(request: MCPResourceRequest): Promise<MCPResourceResponse> {
    const mcpRequest: MCPRequest = {
      jsonrpc: '2.0',
      id: this.generateMessageId(),
      method: 'resources/read',
      params: {
        uri: request.uri
      }
    };

    const response = await this.sendRequest(mcpRequest);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return {
      uri: request.uri,
      content: response.result.content,
      mimeType: response.result.mimeType,
      metadata: response.result.metadata
    };
  }

  async getPrompt(request: MCPPromptRequest): Promise<MCPPromptResponse> {
    const mcpRequest: MCPRequest = {
      jsonrpc: '2.0',
      id: this.generateMessageId(),
      method: 'prompts/get',
      params: {
        name: request.name,
        arguments: request.arguments
      }
    };

    const response = await this.sendRequest(mcpRequest);
    
    if (response.error) {
      throw new Error(response.error.message);
    }
    
    return {
      name: request.name,
      prompt: response.result.prompt,
      metadata: response.result.metadata
    };
  }

  private async startStdioTransport(): Promise<void> {
    const { command, args = [], env = {} } = this.config.transport.config;
    
    if (!command) {
      throw new Error('Stdio transport requires command');
    }

    this.process = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...env }
    });

    this.process.on('error', (error) => {
      this.logService.error(`Server ${this.config.id} process error:`, error);
      this.emit('error', error);
    });

    this.process.on('exit', (code) => {
      this.logService.info(`Server ${this.config.id} process exited with code ${code}`);
      this.config.status = 'disconnected';
      this.emit('disconnected');
    });

    // Handle stdout messages
    if (this.process.stdout) {
      this.process.stdout.on('data', (data) => {
        this.handleMessage(data.toString());
      });
    }

    // Handle stderr logs
    if (this.process.stderr) {
      this.process.stderr.on('data', (data) => {
        this.logService.debug(`Server ${this.config.id} stderr:`, data.toString());
      });
    }
  }

  private handleMessage(data: string): void {
    try {
      const lines = data.trim().split('\n');
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        const message: MCPMessage = JSON.parse(line);
        
        if (message.id && this.pendingRequests.has(message.id)) {
          const request = this.pendingRequests.get(message.id)!;
          clearTimeout(request.timeout);
          this.pendingRequests.delete(message.id);
          
          if (message.error) {
            request.reject(new Error(message.error.message));
          } else {
            request.resolve(message);
          }
        }
      }
    } catch (error) {
      this.logService.error(`Failed to parse message from server ${this.config.id}:`, error);
    }
  }

  private async sendRequest(request: MCPRequest): Promise<MCPResponse> {
    if (!this.process || !this.process.stdin) {
      throw new Error('Server not connected');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(request.id!);
        reject(new Error('Request timeout'));
      }, this.config.config.requestTimeout || 30000);

      this.pendingRequests.set(request.id!, {
        resolve,
        reject,
        timeout
      });

      const message = JSON.stringify(request) + '\n';
      this.process!.stdin!.write(message);
    });
  }

  private generateMessageId(): number {
    return ++this.messageId;
  }
}