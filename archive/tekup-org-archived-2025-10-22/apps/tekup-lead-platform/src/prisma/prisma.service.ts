import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '@tekup/shared';

const logger = createLogger('apps-tekup-lead-platform-src-p');

// Dynamic import for ES module config
let configPromise: Promise<any>;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

  constructor() {
    // Override with SQLite for lead platform development
    const leadPlatformDbUrl = 'file:./dev.db';
    
    super({
      datasources: {
        db: {
          url: leadPlatformDbUrl,
        },
      },
      log: ['query', 'info', 'warn', 'error'],
    });
    
    // Initialize config promise
    configPromise = import('@tekup/config');
  }

  async onModuleInit() {
    await this.$connect();
    logger.info('🗄️  TekUp Lead Platform connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Execute query with tenant context for RLS
   */
  async withTenant<T>(tenantId: string, operation: () => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      // Set RLS context for tenant isolation
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
      return operation();
    });
  }
}
