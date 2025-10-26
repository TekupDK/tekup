import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('🗄️  Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🗄️  Database disconnected');
  }

  async enableShutdownHooks(app: any) {
    // Note: beforeExit is a Prisma event, not a log level
    (this as any).$on('beforeExit', async () => {
      await app.close();
    });
  }
}
