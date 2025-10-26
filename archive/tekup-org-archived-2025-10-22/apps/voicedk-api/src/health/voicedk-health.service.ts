import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { StandardHealthService, DependencyChecker, DependencyHealth, HealthCheckConfig } from '@tekup/health-check';

@Injectable()
export class VoiceDKHealthService extends StandardHealthService {
  constructor(
    configService: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource
  ) {
    const config: HealthCheckConfig = {
      serviceName: 'VoiceDK API',
      version: '1.0.0',
      cacheTimeout: 30000,
      requiredDependencies: ['database', 'redis'],
      redis: {
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: 0,
      },
      database: {
        enabled: true,
        testQuery: 'SELECT 1',
      },
      externalServices: [
        {
          name: 'google-speech-api',
          url: 'https://speech.googleapis.com',
          timeout: 5000,
        },
        {
          name: 'openai-api',
          url: 'https://api.openai.com',
          timeout: 5000,
        },
        {
          name: 'stripe-api',
          url: 'https://api.stripe.com',
          timeout: 5000,
        },
      ],
    };

    super(configService, config);

    // Register custom database checker
    this.registerDatabaseChecker();
  }

  private registerDatabaseChecker(): void {
    const databaseChecker: DependencyChecker = {
      name: 'database',
      check: async (): Promise<DependencyHealth> => {
        const startTime = Date.now();
        
        try {
          // Test basic connectivity
          await this.dataSource.query('SELECT 1 as test');
          
          // Test more specific operations
          const userCount = await this.dataSource.query('SELECT COUNT(*) as count FROM "user"');
          const configCount = await this.dataSource.query('SELECT COUNT(*) as count FROM business_config');
          
          const responseTime = Date.now() - startTime;
          
          return {
            name: 'database',
            status: responseTime < 1000 ? 'healthy' : 'degraded',
            responseTime,
            lastCheck: new Date().toISOString(),
            details: {
              userCount: parseInt(userCount[0]?.count || '0'),
              businessConfigCount: parseInt(configCount[0]?.count || '0'),
              connectionPool: 'active',
              isConnected: this.dataSource.isInitialized,
            },
          };
        } catch (error) {
          const responseTime = Date.now() - startTime;
          
          return {
            name: 'database',
            status: 'unhealthy',
            responseTime,
            lastCheck: new Date().toISOString(),
            error: (error as Error).message,
            details: {
              isConnected: this.dataSource.isInitialized,
            },
          };
        }
      },
    };

    this.registerDependencyChecker(databaseChecker);
  }
}
