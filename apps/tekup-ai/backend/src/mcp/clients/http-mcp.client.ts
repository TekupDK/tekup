import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface HttpMcpServerConfig {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

@Injectable()
export class HttpMcpClient {
  private readonly logger = new Logger(HttpMcpClient.name);
  private readonly defaultTimeout: number;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.defaultTimeout =
      this.configService.get<number>('app.mcp.httpTimeout') || 30000;
  }

  /**
   * List available tools from HTTP MCP server
   */
  async listTools(config: HttpMcpServerConfig): Promise<McpTool[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${config.url}/tools/list`,
          {},
          {
            headers: config.headers,
            timeout: config.timeout || this.defaultTimeout,
          },
        ),
      );

      return response.data.tools || [];
    } catch (error) {
      this.logger.error(
        `Failed to list tools from ${config.url}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Call a tool on HTTP MCP server
   */
  async callTool(
    config: HttpMcpServerConfig,
    toolName: string,
    args: any,
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${config.url}/tools/call`,
          {
            name: toolName,
            arguments: args,
          },
          {
            headers: config.headers,
            timeout: config.timeout || this.defaultTimeout,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to call tool ${toolName} on ${config.url}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * List available resources from HTTP MCP server
   */
  async listResources(config: HttpMcpServerConfig): Promise<McpResource[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${config.url}/resources/list`,
          {},
          {
            headers: config.headers,
            timeout: config.timeout || this.defaultTimeout,
          },
        ),
      );

      return response.data.resources || [];
    } catch (error) {
      this.logger.error(
        `Failed to list resources from ${config.url}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Read a resource from HTTP MCP server
   */
  async readResource(
    config: HttpMcpServerConfig,
    uri: string,
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${config.url}/resources/read`,
          { uri },
          {
            headers: config.headers,
            timeout: config.timeout || this.defaultTimeout,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to read resource ${uri} from ${config.url}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * List available prompts from HTTP MCP server
   */
  async listPrompts(config: HttpMcpServerConfig): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${config.url}/prompts/list`,
          {},
          {
            headers: config.headers,
            timeout: config.timeout || this.defaultTimeout,
          },
        ),
      );

      return response.data.prompts || [];
    } catch (error) {
      this.logger.error(
        `Failed to list prompts from ${config.url}:`,
        error.message,
      );
      return [];
    }
  }

  /**
   * Get a prompt from HTTP MCP server
   */
  async getPrompt(
    config: HttpMcpServerConfig,
    name: string,
    args?: any,
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${config.url}/prompts/get`,
          {
            name,
            arguments: args,
          },
          {
            headers: config.headers,
            timeout: config.timeout || this.defaultTimeout,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to get prompt ${name} from ${config.url}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Health check for HTTP MCP server
   */
  async healthCheck(config: HttpMcpServerConfig): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${config.url}/health`, {
          headers: config.headers,
          timeout: 5000,
        }),
      );

      return response.status === 200;
    } catch (error) {
      this.logger.warn(
        `Health check failed for ${config.url}:`,
        error.message,
      );
      return false;
    }
  }
}
