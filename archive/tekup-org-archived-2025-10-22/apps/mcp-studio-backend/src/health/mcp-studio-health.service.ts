import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StandardHealthService, DependencyChecker, DependencyHealth, HealthCheckConfig } from '@tekup/health-check';

@Injectable()
export class MCPStudioHealthService extends StandardHealthService {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    const config: HealthCheckConfig = {
      serviceName: 'MCP Studio Backend',
      version: '1.0.0',
      cacheTimeout: 30000,
      requiredDependencies: ['database'],
      database: {
        enabled: true,
        testQuery: 'SELECT 1',
      },
      externalServices: [
        {
          name: 'docker-daemon',
          url: 'http://localhost:2375', // Default Docker daemon URL
          timeout: 5000,
        },
      ],
    };

    super(configService, config);

    // Register custom database checker using Prisma
    this.registerPrismaDatabaseChecker();
  }

  private registerPrismaDatabaseChecker(): void {
    const databaseChecker: DependencyChecker = {
      name: 'database',
      check: async (): Promise<DependencyHealth> => {
        const startTime = Date.now();
        
        try {
          // Test basic connectivity with Prisma
          await this.prisma.$queryRaw`SELECT 1 as test`;
          
          // Test more specific MCP Studio operations
          const projectCount = await this.prisma.project.count();
          const mcpServerCount = await this.prisma.mCPServer.count();
          
          const responseTime = Date.now() - startTime;
          
          return {
            name: 'database',
            status: responseTime < 1000 ? 'healthy' : 'degraded',
            responseTime,
            lastCheck: new Date().toISOString(),
            details: {
              projectCount,
              mcpServerCount,
              prismaConnected: true,
              databaseType: 'postgresql', // Assuming PostgreSQL based on typical Prisma usage
            },
          };
        } catch (error) {
          const responseTime = Date.now() - startTime;
          
          return {
            name: 'database',
            status: 'unhealthy',
            responseTime,
            lastCheck: new Date().toISOString(),
            error: error.message,
            details: {
              prismaConnected: false,
            },
          };
        }
      },
    };

    this.registerDependencyChecker(databaseChecker);
  }

  /**
   * Additional MCP Studio specific health checks
   */
  async getMCPStudioStatus(): Promise<any> {
    const baseHealth = await this.getHealthStatus(true);
    
    try {
      // Check Docker daemon connectivity for deployments
      const dockerStatus = await this.checkDockerDaemon();
      
      // Check recent MCP server activities
      const recentServers = await this.prisma.mCPServer.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      return {
        ...baseHealth,
        mcpStudio: {
          dockerDaemon: dockerStatus,
          recentServerActivity: recentServers,
        },
      };
    } catch (error) {
      return {
        ...baseHealth,
        mcpStudio: {
          error: error.message,
        },
      };
    }
  }

  private async checkDockerDaemon(): Promise<{ available: boolean; version?: string }> {
    try {
      // Simple check to see if Docker daemon is running
      const dockerode = await import('dockerode');
      const docker = new dockerode.default();
      const info = await docker.version();
      
      return {
        available: true,
        version: info.Version,
      };
    } catch (error) {
      return {
        available: false,
      };
    }
  }
}
