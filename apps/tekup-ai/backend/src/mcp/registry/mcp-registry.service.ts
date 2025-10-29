import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { HttpMcpClient, HttpMcpServerConfig } from '../clients/http-mcp.client';
import { StdioMcpClient, StdioMcpServerConfig } from '../clients/stdio-mcp.client';

export interface RegisterMcpServerDto {
  name: string;
  displayName: string;
  description?: string;
  type: 'http' | 'stdio';
  config: HttpMcpServerConfig | StdioMcpServerConfig;
  isPublic?: boolean;
  category?: string;
  icon?: string;
  version?: string;
}

export interface McpServerInfo {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  type: 'http' | 'stdio';
  isActive: boolean;
  isRunning?: boolean;
  tools?: any[];
  resources?: any[];
  category?: string;
  icon?: string;
  version?: string;
}

@Injectable()
export class McpRegistryService {
  private readonly logger = new Logger(McpRegistryService.name);

  constructor(
    private prisma: PrismaService,
    private httpClient: HttpMcpClient,
    private stdioClient: StdioMcpClient,
  ) {}

  /**
   * Register a new MCP server
   */
  async registerServer(dto: RegisterMcpServerDto): Promise<McpServerInfo> {
    try {
      const server = await this.prisma.aiMcpServerRegistry.create({
        data: {
          name: dto.name,
          displayName: dto.displayName,
          description: dto.description,
          type: dto.type,
          config: JSON.parse(JSON.stringify(dto.config)),
          isPublic: dto.isPublic ?? false,
          category: dto.category,
          icon: dto.icon,
          version: dto.version,
        },
      });

      this.logger.log(`Registered MCP server: ${dto.name}`);

      return this.toServerInfo(server);
    } catch (error) {
      this.logger.error(`Failed to register server ${dto.name}:`, error);
      throw error;
    }
  }

  /**
   * Get all registered MCP servers
   */
  async listServers(isPublic?: boolean): Promise<McpServerInfo[]> {
    const servers = await this.prisma.aiMcpServerRegistry.findMany({
      where: isPublic !== undefined ? { isPublic } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      servers.map(async (server) => {
        const info = this.toServerInfo(server);

        // Check if STDIO server is running
        if (server.type === 'stdio') {
          info.isRunning = this.stdioClient.isRunning(server.id);
        }

        return info;
      }),
    );
  }

  /**
   * Get a specific MCP server
   */
  async getServer(serverId: string): Promise<McpServerInfo> {
    const server = await this.prisma.aiMcpServerRegistry.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException(`Server ${serverId} not found`);
    }

    const info = this.toServerInfo(server);

    // Get tools and resources
    try {
      if (server.type === 'http') {
        const config = server.config as HttpMcpServerConfig;
        const [tools, resources] = await Promise.all([
          this.httpClient.listTools(config),
          this.httpClient.listResources(config),
        ]);
        info.tools = tools;
        info.resources = resources;
      } else if (server.type === 'stdio') {
        if (this.stdioClient.isRunning(server.id)) {
          const [tools, resources] = await Promise.all([
            this.stdioClient.listTools(server.id),
            this.stdioClient.listResources(server.id),
          ]);
          info.tools = tools;
          info.resources = resources;
          info.isRunning = true;
        }
      }
    } catch (error) {
      this.logger.error(`Failed to get server info for ${serverId}:`, error);
    }

    return info;
  }

  /**
   * Update MCP server
   */
  async updateServer(
    serverId: string,
    updates: Partial<RegisterMcpServerDto>,
  ): Promise<McpServerInfo> {
    const server = await this.prisma.aiMcpServerRegistry.update({
      where: { id: serverId },
      data: {
        displayName: updates.displayName,
        description: updates.description,
        config: updates.config
          ? JSON.parse(JSON.stringify(updates.config))
          : undefined,
        isActive: updates.isPublic,
        category: updates.category,
        icon: updates.icon,
        version: updates.version,
      },
    });

    this.logger.log(`Updated MCP server: ${serverId}`);

    return this.toServerInfo(server);
  }

  /**
   * Delete MCP server
   */
  async deleteServer(serverId: string): Promise<void> {
    // Stop STDIO server if running
    if (this.stdioClient.isRunning(serverId)) {
      await this.stdioClient.stopServer(serverId);
    }

    await this.prisma.aiMcpServerRegistry.delete({
      where: { id: serverId },
    });

    this.logger.log(`Deleted MCP server: ${serverId}`);
  }

  /**
   * Start STDIO MCP server
   */
  async startStdioServer(serverId: string): Promise<void> {
    const server = await this.prisma.aiMcpServerRegistry.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException(`Server ${serverId} not found`);
    }

    if (server.type !== 'stdio') {
      throw new Error('Only STDIO servers can be started');
    }

    const config = server.config as StdioMcpServerConfig;
    await this.stdioClient.startServer(serverId, config);
  }

  /**
   * Stop STDIO MCP server
   */
  async stopStdioServer(serverId: string): Promise<void> {
    await this.stdioClient.stopServer(serverId);
  }

  /**
   * Health check for HTTP MCP server
   */
  async healthCheck(serverId: string): Promise<boolean> {
    const server = await this.prisma.aiMcpServerRegistry.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException(`Server ${serverId} not found`);
    }

    if (server.type === 'http') {
      const config = server.config as HttpMcpServerConfig;
      return this.httpClient.healthCheck(config);
    } else if (server.type === 'stdio') {
      return this.stdioClient.isRunning(serverId);
    }

    return false;
  }

  /**
   * Convert database model to info object
   */
  private toServerInfo(server: any): McpServerInfo {
    return {
      id: server.id,
      name: server.name,
      displayName: server.displayName,
      description: server.description,
      type: server.type,
      isActive: server.isActive,
      category: server.category,
      icon: server.icon,
      version: server.version,
    };
  }

  /**
   * Cleanup on service destroy
   */
  async onModuleDestroy() {
    await this.stdioClient.stopAll();
  }
}
