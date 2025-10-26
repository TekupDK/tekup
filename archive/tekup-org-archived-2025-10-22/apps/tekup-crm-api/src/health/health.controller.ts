import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', example: 123.45 },
        environment: { type: 'string', example: 'development' },
        version: { type: 'string', example: '1.0.0' },
      },
    },
  })
  async getHealth() {
    return this.healthService.getHealth();
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with database connectivity' })
  @ApiResponse({ 
    status: 200, 
    description: 'Detailed health information',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', example: 123.45 },
        environment: { type: 'string', example: 'development' },
        version: { type: 'string', example: '1.0.0' },
        responseTime: { type: 'string', example: '15ms' },
        database: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'connected' },
            responseTime: { type: 'string', example: '< 100ms' },
          },
        },
        memory: {
          type: 'object',
          properties: {
            used: { type: 'string', example: '45MB' },
            total: { type: 'string', example: '128MB' },
            external: { type: 'string', example: '12MB' },
          },
        },
        system: {
          type: 'object',
          properties: {
            platform: { type: 'string', example: 'linux' },
            nodeVersion: { type: 'string', example: 'v18.17.0' },
            pid: { type: 'number', example: 12345 },
          },
        },
      },
    },
  })
  async getDetailedHealth() {
    return this.healthService.getDetailedHealth();
  }
}