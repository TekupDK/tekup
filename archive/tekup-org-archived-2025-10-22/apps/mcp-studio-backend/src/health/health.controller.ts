import { Controller, Get, HttpCode, HttpStatus, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StandardHealthController } from '@tekup/health-check';
import { MCPStudioHealthService } from './mcp-studio-health.service';

@ApiTags('Health')
@Controller('health')
export class MCPStudioHealthController extends StandardHealthController {
  constructor(private readonly mcpStudioHealthService: MCPStudioHealthService) {
    super(mcpStudioHealthService);
  }

  /**
   * MCP Studio specific health check
   */
  @Get('mcp-studio')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @ApiOperation({ 
    summary: 'MCP Studio specific health check',
    description: 'Returns MCP Studio specific health information including Docker daemon status'
  })
  @ApiResponse({ status: 200, description: 'MCP Studio health status' })
  async getMCPStudioHealth(): Promise<any> {
    return await this.mcpStudioHealthService.getMCPStudioStatus();
  }

  /**
   * Docker daemon health check
   */
  @Get('docker')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @ApiOperation({ 
    summary: 'Docker daemon health check',
    description: 'Check if Docker daemon is available for MCP server deployments'
  })
  @ApiResponse({ status: 200, description: 'Docker daemon status' })
  async getDockerHealth(): Promise<any> {
    const status = await this.mcpStudioHealthService.getMCPStudioStatus();
    
    return {
      status: status.mcpStudio?.dockerDaemon?.available ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'MCP Studio Backend',
      docker: status.mcpStudio?.dockerDaemon || { available: false },
    };
  }
}
