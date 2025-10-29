import { Injectable, Logger } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import { ConfigService } from '@nestjs/config';

export interface StdioMcpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

@Injectable()
export class StdioMcpClient {
  private readonly logger = new Logger(StdioMcpClient.name);
  private processes = new Map<string, ChildProcess>();
  private requestId = 0;
  private pendingRequests = new Map<
    number,
    {
      resolve: (value: any) => void;
      reject: (error: any) => void;
    }
  >();

  constructor(private configService: ConfigService) {}

  /**
   * Start a STDIO MCP server process
   */
  async startServer(
    serverId: string,
    config: StdioMcpServerConfig,
  ): Promise<void> {
    if (this.processes.has(serverId)) {
      this.logger.warn(`Server ${serverId} is already running`);
      return;
    }

    try {
      const process = spawn(config.command, config.args || [], {
        env: { ...process.env, ...config.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.processes.set(serverId, process);

      // Handle stdout (JSON-RPC responses)
      let buffer = '';
      process.stdout?.on('data', (data: Buffer) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const response: JsonRpcResponse = JSON.parse(line);
              this.handleResponse(response);
            } catch (error) {
              this.logger.error('Failed to parse response:', line);
            }
          }
        }
      });

      // Handle stderr
      process.stderr?.on('data', (data: Buffer) => {
        this.logger.warn(`[${serverId}] stderr:`, data.toString());
      });

      // Handle process exit
      process.on('exit', (code) => {
        this.logger.warn(`Server ${serverId} exited with code ${code}`);
        this.processes.delete(serverId);
      });

      process.on('error', (error) => {
        this.logger.error(`Server ${serverId} error:`, error);
        this.processes.delete(serverId);
      });

      // Initialize connection
      await this.sendRequest(serverId, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'TekupAI',
          version: '1.0.0',
        },
      });

      this.logger.log(`Started STDIO MCP server: ${serverId}`);
    } catch (error) {
      this.logger.error(`Failed to start server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Stop a STDIO MCP server process
   */
  async stopServer(serverId: string): Promise<void> {
    const process = this.processes.get(serverId);
    if (!process) {
      this.logger.warn(`Server ${serverId} is not running`);
      return;
    }

    try {
      process.kill();
      this.processes.delete(serverId);
      this.logger.log(`Stopped STDIO MCP server: ${serverId}`);
    } catch (error) {
      this.logger.error(`Failed to stop server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * List tools from STDIO MCP server
   */
  async listTools(serverId: string): Promise<any[]> {
    const response = await this.sendRequest(serverId, 'tools/list', {});
    return response.tools || [];
  }

  /**
   * Call a tool on STDIO MCP server
   */
  async callTool(serverId: string, toolName: string, args: any): Promise<any> {
    return this.sendRequest(serverId, 'tools/call', {
      name: toolName,
      arguments: args,
    });
  }

  /**
   * List resources from STDIO MCP server
   */
  async listResources(serverId: string): Promise<any[]> {
    const response = await this.sendRequest(serverId, 'resources/list', {});
    return response.resources || [];
  }

  /**
   * Read a resource from STDIO MCP server
   */
  async readResource(serverId: string, uri: string): Promise<any> {
    return this.sendRequest(serverId, 'resources/read', { uri });
  }

  /**
   * Send JSON-RPC request to server
   */
  private async sendRequest(
    serverId: string,
    method: string,
    params: any,
  ): Promise<any> {
    const process = this.processes.get(serverId);
    if (!process) {
      throw new Error(`Server ${serverId} is not running`);
    }

    const id = ++this.requestId;
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout for method ${method}`));
      }, 30000);

      try {
        process.stdin?.write(JSON.stringify(request) + '\n');
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  /**
   * Handle JSON-RPC response
   */
  private handleResponse(response: JsonRpcResponse): void {
    const pending = this.pendingRequests.get(response.id);
    if (!pending) {
      this.logger.warn(`Received response for unknown request ${response.id}`);
      return;
    }

    this.pendingRequests.delete(response.id);

    if (response.error) {
      pending.reject(
        new Error(`RPC Error: ${response.error.message}`),
      );
    } else {
      pending.resolve(response.result);
    }
  }

  /**
   * Check if server is running
   */
  isRunning(serverId: string): boolean {
    return this.processes.has(serverId);
  }

  /**
   * Stop all servers (cleanup)
   */
  async stopAll(): Promise<void> {
    const serverIds = Array.from(this.processes.keys());
    await Promise.all(serverIds.map((id) => this.stopServer(id)));
  }
}
