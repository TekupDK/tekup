import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpMcpClient, HttpMcpServerConfig } from './clients/http-mcp.client';
import { StdioMcpClient } from './clients/stdio-mcp.client';
import { McpRegistryService } from './registry/mcp-registry.service';
import { PrismaService } from '../database/prisma.service';

export interface CallToolDto {
  serverId: string;
  toolName: string;
  arguments: any;
}

export interface ReadResourceDto {
  serverId: string;
  uri: string;
}

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);

  constructor(
    private prisma: PrismaService,
    private httpClient: HttpMcpClient,
    private stdioClient: StdioMcpClient,
    private registry: McpRegistryService,
  ) {}

  /**
   * Get all tools from enabled MCP servers for a user
   */
  async getAvailableTools(userId: string): Promise<any[]> {
    try {
      // Get user's enabled MCP servers
      const userSettings = await this.prisma.aiUserSettings.findUnique({
        where: { userId },
        select: { enabledMcpServers: true },
      });

      const enabledServerIds = (userSettings?.enabledMcpServers as string[]) || [];

      if (enabledServerIds.length === 0) {
        return [];
      }

      // Get server configs
      const servers = await this.prisma.aiMcpServerRegistry.findMany({
        where: {
          id: { in: enabledServerIds },
          isActive: true,
        },
      });

      // Fetch tools from all servers
      const toolPromises = servers.map(async (server) => {
        try {
          let tools: any[] = [];

          if (server.type === 'http') {
            const config = server.config as HttpMcpServerConfig;
            tools = await this.httpClient.listTools(config);
          } else if (server.type === 'stdio') {
            if (this.stdioClient.isRunning(server.id)) {
              tools = await this.stdioClient.listTools(server.id);
            }
          }

          // Add server context to tools
          return tools.map((tool) => ({
            ...tool,
            _serverId: server.id,
            _serverName: server.displayName,
          }));
        } catch (error) {
          this.logger.error(
            `Failed to get tools from server ${server.name}:`,
            error,
          );
          return [];
        }
      });

      const toolArrays = await Promise.all(toolPromises);
      return toolArrays.flat();
    } catch (error) {
      this.logger.error('Failed to get available tools:', error);
      return [];
    }
  }

  /**
   * Call a tool on an MCP server
   */
  async callTool(dto: CallToolDto): Promise<any> {
    try {
      const server = await this.prisma.aiMcpServerRegistry.findUnique({
        where: { id: dto.serverId },
      });

      if (!server) {
        throw new NotFoundException(`Server ${dto.serverId} not found`);
      }

      let result: any;

      if (server.type === 'http') {
        const config = server.config as HttpMcpServerConfig;
        result = await this.httpClient.callTool(
          config,
          dto.toolName,
          dto.arguments,
        );
      } else if (server.type === 'stdio') {
        if (!this.stdioClient.isRunning(dto.serverId)) {
          throw new Error(`Server ${dto.serverId} is not running`);
        }
        result = await this.stdioClient.callTool(
          dto.serverId,
          dto.toolName,
          dto.arguments,
        );
      } else {
        throw new Error(`Unsupported server type: ${server.type}`);
      }

      this.logger.log(
        `Called tool ${dto.toolName} on server ${server.displayName}`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to call tool ${dto.toolName}:`, error);
      throw error;
    }
  }

  /**
   * Get all resources from enabled MCP servers for a user
   */
  async getAvailableResources(userId: string): Promise<any[]> {
    try {
      const userSettings = await this.prisma.aiUserSettings.findUnique({
        where: { userId },
        select: { enabledMcpServers: true },
      });

      const enabledServerIds = (userSettings?.enabledMcpServers as string[]) || [];

      if (enabledServerIds.length === 0) {
        return [];
      }

      const servers = await this.prisma.aiMcpServerRegistry.findMany({
        where: {
          id: { in: enabledServerIds },
          isActive: true,
        },
      });

      const resourcePromises = servers.map(async (server) => {
        try {
          let resources: any[] = [];

          if (server.type === 'http') {
            const config = server.config as HttpMcpServerConfig;
            resources = await this.httpClient.listResources(config);
          } else if (server.type === 'stdio') {
            if (this.stdioClient.isRunning(server.id)) {
              resources = await this.stdioClient.listResources(server.id);
            }
          }

          return resources.map((resource) => ({
            ...resource,
            _serverId: server.id,
            _serverName: server.displayName,
          }));
        } catch (error) {
          this.logger.error(
            `Failed to get resources from server ${server.name}:`,
            error,
          );
          return [];
        }
      });

      const resourceArrays = await Promise.all(resourcePromises);
      return resourceArrays.flat();
    } catch (error) {
      this.logger.error('Failed to get available resources:', error);
      return [];
    }
  }

  /**
   * Read a resource from an MCP server
   */
  async readResource(dto: ReadResourceDto): Promise<any> {
    try {
      const server = await this.prisma.aiMcpServerRegistry.findUnique({
        where: { id: dto.serverId },
      });

      if (!server) {
        throw new NotFoundException(`Server ${dto.serverId} not found`);
      }

      let result: any;

      if (server.type === 'http') {
        const config = server.config as HttpMcpServerConfig;
        result = await this.httpClient.readResource(config, dto.uri);
      } else if (server.type === 'stdio') {
        if (!this.stdioClient.isRunning(dto.serverId)) {
          throw new Error(`Server ${dto.serverId} is not running`);
        }
        result = await this.stdioClient.readResource(dto.serverId, dto.uri);
      } else {
        throw new Error(`Unsupported server type: ${server.type}`);
      }

      this.logger.log(
        `Read resource ${dto.uri} from server ${server.displayName}`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to read resource ${dto.uri}:`, error);
      throw error;
    }
  }

  /**
   * Enable MCP servers for a user
   */
  async enableServersForUser(
    userId: string,
    serverIds: string[],
  ): Promise<void> {
    await this.prisma.aiUserSettings.upsert({
      where: { userId },
      update: {
        enabledMcpServers: JSON.parse(JSON.stringify(serverIds)),
      },
      create: {
        userId,
        enabledMcpServers: JSON.parse(JSON.stringify(serverIds)),
      },
    });

    this.logger.log(`Updated enabled MCP servers for user ${userId}`);
  }

  /**
   * Get user's enabled MCP servers
   */
  async getUserEnabledServers(userId: string): Promise<string[]> {
    const userSettings = await this.prisma.aiUserSettings.findUnique({
      where: { userId },
      select: { enabledMcpServers: true },
    });

    return (userSettings?.enabledMcpServers as string[]) || [];
  }
}
