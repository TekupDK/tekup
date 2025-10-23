import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Import from @tekup/database - renos client
import { renos } from '@tekup/database';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      await renos.$connect();
      this.logger.log('Connected to tekup-database (renos schema)');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await renos.$disconnect();
      this.logger.log('Disconnected from tekup-database');
    } catch (error) {
      this.logger.error('Failed to disconnect from database:', error);
    }
  }

  // Direct access to renos client
  get client() {
    return renos;
  }

  // Customers
  get customers() {
    return renos.customers;
  }

  // Jobs
  get jobs() {
    return renos.jobs;
  }

  // Job assignments
  get jobAssignments() {
    return renos.job_assignments;
  }

  // Team members
  get teamMembers() {
    return renos.team_members;
  }

  // Users
  get users() {
    return renos.users;
  }

  // Organizations
  get organizations() {
    return renos.organizations;
  }

  // Customer messages
  get customerMessages() {
    return renos.customer_messages;
  }

  // Customer reviews
  get customerReviews() {
    return renos.customer_reviews;
  }

  // Time entries
  get timeEntries() {
    return renos.time_entries;
  }

  // Chat sessions
  get chatSessions() {
    return renos.chat_sessions;
  }

  // Chat messages
  get chatMessages() {
    return renos.chat_messages;
  }

  // Transaction support
  async transaction<T>(operations: (prisma: typeof renos) => Promise<T>): Promise<T> {
    return renos.$transaction(operations);
  }

  // Raw query support
  async $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: any[]): Promise<T> {
    return renos.$queryRaw(query, ...values);
  }

  async $executeRaw(query: TemplateStringsArray, ...values: any[]): Promise<number> {
    return renos.$executeRaw(query, ...values);
  }
}