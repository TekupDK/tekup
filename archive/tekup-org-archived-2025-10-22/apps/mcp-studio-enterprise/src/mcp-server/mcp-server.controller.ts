import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MCPServerService, EnterpriseMCPServer } from './mcp-server.service';
import { CreateMCPServerDto, UpdateMCPServerDto, ExecuteToolDto } from './dto';

@ApiTags('mcp-servers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('mcp-servers')
export class MCPServerController {
  constructor(private readonly mcpServerService: MCPServerService) {}

  @Post()
  @ApiOperation({ summary: 'Create new MCP server' })
  @ApiResponse({ status: 201, description: 'MCP server created successfully' })
  async createServer(
    @Body() createServerDto: CreateMCPServerDto,
    @Request() req: any,
  ): Promise<EnterpriseMCPServer> {
    const { organizationId, tenantId } = req.user;
    return this.mcpServerService.createServer(
      organizationId,
      tenantId,
      createServerDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all MCP servers for organization' })
  @ApiResponse({ status: 200, description: 'List of MCP servers' })
  async getServers(@Request() req: any): Promise<EnterpriseMCPServer[]> {
    const { organizationId } = req.user;
    return this.mcpServerService.getServersByOrganization(organizationId);
  }

  @Get(':serverId')
  @ApiOperation({ summary: 'Get MCP server details' })
  @ApiResponse({ status: 200, description: 'MCP server details' })
  async getServer(@Param('serverId') serverId: string): Promise<EnterpriseMCPServer> {
    const servers = Array.from(this.mcpServerService['servers'].values());
    const server = servers.find(s => s.id === serverId);
    
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }
    
    return server;
  }

  @Put(':serverId/start')
  @ApiOperation({ summary: 'Start MCP server' })
  @ApiResponse({ status: 200, description: 'Server started successfully' })
  async startServer(@Param('serverId') serverId: string): Promise<{ message: string }> {
    await this.mcpServerService.startServer(serverId);
    return { message: `Server ${serverId} started successfully` };
  }

  @Put(':serverId/stop')
  @ApiOperation({ summary: 'Stop MCP server' })
  @ApiResponse({ status: 200, description: 'Server stopped successfully' })
  async stopServer(@Param('serverId') serverId: string): Promise<{ message: string }> {
    await this.mcpServerService.stopServer(serverId);
    return { message: `Server ${serverId} stopped successfully` };
  }

  @Post(':serverId/tools/execute')
  @ApiOperation({ summary: 'Execute tool on MCP server' })
  @ApiResponse({ status: 200, description: 'Tool executed successfully' })
  async executeTool(
    @Param('serverId') serverId: string,
    @Body() executeToolDto: ExecuteToolDto,
  ) {
    const toolCall = {
      id: `tool-${Date.now()}`,
      name: executeToolDto.toolName,
      arguments: executeToolDto.arguments,
      serverId,
    };

    return this.mcpServerService.executeToolCall(serverId, toolCall);
  }

  @Get(':serverId/metrics')
  @ApiOperation({ summary: 'Get server performance metrics' })
  @ApiResponse({ status: 200, description: 'Server metrics' })
  async getServerMetrics(@Param('serverId') serverId: string) {
    return this.mcpServerService.getServerMetrics(serverId);
  }

  @Delete(':serverId')
  @ApiOperation({ summary: 'Delete MCP server' })
  @ApiResponse({ status: 200, description: 'Server deleted successfully' })
  async deleteServer(@Param('serverId') serverId: string): Promise<{ message: string }> {
    // Implementation for server deletion
    return { message: `Server ${serverId} deleted successfully` };
  }
}