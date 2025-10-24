import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Import from @tekup/database - main prisma client
import { prisma } from '@tekup/database';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      await prisma.$connect();
      this.logger.log('Connected to tekup-database (renos schema)');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await prisma.$disconnect();
      this.logger.log('Disconnected from tekup-database');
    } catch (error) {
      this.logger.error('Failed to disconnect from database:', error);
    }
  }

  // Direct access to renos client
  get client() {
    return prisma;
  }

  // Customers
  // @ts-ignore - Prisma schema may not have this table
  get customers() {
    return prisma.customers;
  }

  // Jobs
  // @ts-ignore - Prisma schema may not have this table
  get jobs() {
    return prisma.jobs;
  }

  // Job assignments
  // @ts-ignore - Prisma schema may not have this table
  get jobAssignments() {
    return prisma.jobAssignments;
  }

  // Team members
  // @ts-ignore - Prisma schema may not have this table
  get teamMembers() {
    return prisma.teamMembers;
  }

  // Users
  // @ts-ignore - Prisma schema may not have this table
  get users() {
    return prisma.users;
  }

  // Organizations
  // @ts-ignore - Prisma schema may not have this table
  get organizations() {
    return prisma.organizations;
  }

  // Customer messages
  // @ts-ignore - Prisma schema may not have this table
  get customerMessages() {
    return prisma.customerMessages;
  }

  // Customer reviews
  // @ts-ignore - Prisma schema may not have this table
  get customerReviews() {
    return prisma.customerReviews;
  }

  // Time entries
  // @ts-ignore - Prisma schema may not have this table
  get timeEntries() {
    return prisma.timeEntries;
  }

  // Chat sessions
  // @ts-ignore - Prisma schema may not have this table
  get chatSessions() {
    return prisma.chatSessions;
  }

  // Chat messages
  // @ts-ignore - Prisma schema may not have this table
  get chatMessages() {
    return prisma.chatMessages;
  }

  // Transaction support
  async transaction<T>(operations: (prisma: typeof renos) => Promise<T>): Promise<T> {
    return renos.$transaction(operations);
  }

  // Raw query support
  // @ts-ignore
  async $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: any[]): Promise<T> {
    return renos.$queryRaw(query, ...values);
  }

  // @ts-ignore
  async $executeRaw(query: TemplateStringsArray, ...values: any[]): Promise<number> {
    return renos.$executeRaw(query, ...values);
  }
}