import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StandardHealthService } from './health.service.js';
import { StandardHealthController } from './health.controller.js';
import { HealthCheckConfig } from './types.js';

export const HEALTH_CHECK_CONFIG = 'HEALTH_CHECK_CONFIG';

@Module({})
export class HealthCheckModule {
  static forRoot(config: HealthCheckConfig): DynamicModule {
    return {
      module: HealthCheckModule,
      imports: [ConfigModule],
      controllers: [StandardHealthController],
      providers: [
        {
          provide: HEALTH_CHECK_CONFIG,
          useValue: config,
        },
        {
          provide: StandardHealthService,
          useFactory: (configService: any) => {
            return new StandardHealthService(configService, config);
          },
          inject: ['ConfigService'],
        },
      ],
      exports: [StandardHealthService, HEALTH_CHECK_CONFIG],
      global: true,
    };
  }

  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<HealthCheckConfig> | HealthCheckConfig;
    inject?: any[];
  }): DynamicModule {
    return {
      module: HealthCheckModule,
      imports: [ConfigModule],
      controllers: [StandardHealthController],
      providers: [
        {
          provide: HEALTH_CHECK_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: StandardHealthService,
          useFactory: (configService: any, healthConfig: HealthCheckConfig) => {
            return new StandardHealthService(configService, healthConfig);
          },
          inject: ['ConfigService', HEALTH_CHECK_CONFIG],
        },
      ],
      exports: [StandardHealthService, HEALTH_CHECK_CONFIG],
      global: true,
    };
  }
}
