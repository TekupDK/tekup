import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Basic health check
   */
  async getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get('NODE_ENV', 'development'),
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  /**
   * Detailed health check with database connectivity
   */
  async getDetailedHealth() {
    const startTime = Date.now();
    
    // Check database connectivity
    const dbHealth = await this.checkDatabaseHealth();
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    
    // Check environment
    const environment = this.configService.get('NODE_ENV', 'development');
    
    const responseTime = Date.now() - startTime;

    return {
      status: dbHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment,
      version: process.env.npm_package_version || '1.0.0',
      responseTime: `${responseTime}ms`,
      database: {
        status: dbHealth ? 'connected' : 'disconnected',
        responseTime: dbHealth ? '< 100ms' : 'timeout',
      },
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid,
      },
    };
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      return await this.prisma.healthCheck();
    } catch (error) {
      return false;
    }
  }
}