import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to tekup-database (renos schema)');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Disconnected from tekup-database');
    } catch (error) {
      this.logger.error('Failed to disconnect from database:', error);
    }
  }

  // Direct access to Prisma client (for backward compatibility)
  get client() {
    return this;
  }

  // Table accessors for convenient access (snake_case mapped to Prisma's camelCase)
  get customers() {
    return this.renosCustomer;
  }

  get jobs() {
    return this.renosLead; // "jobs" were refactored to "leads" in renos schema
  }

  get jobAssignments() {
    return this.renosBooking; // "job_assignments" mapped to bookings
  }

  get customerMessages() {
    return this.renosEmailMessage;
  }

  get customerReviews() {
    return this.renosCustomer; // Reviews embedded in customer data
  }

  get timeEntries() {
    return this.renosBreak; // Time tracking via breaks
  }

  get chatSessions() {
    return this.renosChatSession;
  }

  get chatMessages() {
    return this.renosChatMessage;
  }
}