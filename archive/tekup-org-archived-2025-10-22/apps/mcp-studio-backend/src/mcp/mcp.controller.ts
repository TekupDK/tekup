import { Controller, Post, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TekUpAuthGuard, CurrentUser, CurrentTenant } from '@tekup/sso';
import { MCPServerDevelopmentService, MCPProjectRequest } from './server-development.service';

@ApiTags('mcp')
@ApiBearerAuth()
@UseGuards(TekUpAuthGuard)
@Controller('mcp')
export class MCPController {
  constructor(private readonly mcpService: MCPServerDevelopmentService) {}

  @Post('projects')
  @ApiOperation({ summary: 'Create new MCP server project with scaffolding' })
  async createProject(
    @Body() request: MCPProjectRequest,
    @CurrentUser() user: any,
    @CurrentTenant() tenant: any
  ) {
    return this.mcpService.createMCPProject({ ...request, userId: user.id });
  }

  @Get('projects/:projectId/validate')
  @ApiOperation({ summary: 'Validate MCP server implementation' })
  async validateProject(
    @Param('projectId') projectId: string,
    @CurrentTenant() tenant: any
  ) {
    return this.mcpService.validateMCPServer(projectId);
  }

  @Post('projects/:projectId/deploy')
  @ApiOperation({ summary: 'Deploy MCP server to marketplace' })
  async deployProject(
    @Param('projectId') projectId: string,
    @CurrentTenant() tenant: any
  ) {
    return this.mcpService.deployToMarketplace(projectId);
  }
}
