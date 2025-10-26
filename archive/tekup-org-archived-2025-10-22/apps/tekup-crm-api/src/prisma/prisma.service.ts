import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('DATABASE_URL'),
        },
      },
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    // Log database queries in development
    if (configService.get('NODE_ENV') === 'development') {
      this.$on('query', (e) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    // Log database errors
    this.$on('error', (e) => {
      this.logger.error('Database error:', e);
    });

    // Log database info
    this.$on('info', (e) => {
      this.logger.log(`Database info: ${e.message}`);
    });

    // Log database warnings
    this.$on('warn', (e) => {
      this.logger.warn(`Database warning: ${e.message}`);
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Database disconnected');
  }

  /**
   * Get tenant context for multi-tenant queries
   */
  getTenantContext(tenantId: string) {
    return {
      where: {
        tenantId,
      },
    };
  }

  /**
   * Execute transaction with tenant context
   */
  async executeWithTenant<T>(
    tenantId: string,
    callback: (prisma: PrismaService) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (prisma) => {
      // Add tenant context to all queries
      const tenantPrisma = prisma as any;
      tenantPrisma.tenantId = tenantId;
      
      return callback(tenantPrisma);
    });
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }
}