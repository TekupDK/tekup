import { PrismaClient } from '@prisma/client';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { v4 as uuidv4 } from 'uuid';

export interface TestDatabaseConfig {
  database: string;
  username: string;
  password: string;
  port: number;
}

export class TestDatabase {
  private container: StartedTestContainer | null = null;
  private prisma: PrismaClient | null = null;
  private testId: string;

  constructor(private config: TestDatabaseConfig) {
    this.testId = uuidv4();
  }

  async start(): Promise<PrismaClient> {
    // Start PostgreSQL container
    this.container = await new GenericContainer('postgres:15-alpine')
      .withEnvironment({
        POSTGRES_DB: this.config.database,
        POSTGRES_USER: this.config.username,
        POSTGRES_PASSWORD: this.config.password,
      })
      .withExposedPorts(this.config.port)
      .start();

    const mappedPort = this.container.getMappedPort(this.config.port);
    const host = this.container.getHost();
    
    // Create Prisma client with test database
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: `postgresql://${this.config.username}:${this.config.password}@${host}:${mappedPort}/${this.config.database}`,
        },
      },
    });

    // Wait for database to be ready
    await this.waitForDatabase();
    
    // Run migrations
    await this.runMigrations();
    
    return this.prisma;
  }

  async stop(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
    }
    
    if (this.container) {
      await this.container.stop();
      this.container = null;
    }
  }

  async cleanup(): Promise<void> {
    if (this.prisma) {
      // Clean up all test data
      await this.prisma.$transaction([
        this.prisma.leadEvent.deleteMany({}),
        this.prisma.lead.deleteMany({}),
        this.prisma.tenantSetting.deleteMany({}),
        this.prisma.duplicateGroup.deleteMany({}),
        this.prisma.tenant.deleteMany({}),
      ]);
    }
  }

  private async waitForDatabase(): Promise<void> {
    let retries = 30;
    while (retries > 0) {
      try {
        await this.prisma!.$queryRaw`SELECT 1`;
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw new Error('Database failed to start within timeout');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private async runMigrations(): Promise<void> {
    // In a real implementation, you would run Prisma migrations
    // For now, we'll create basic tables
    await this.prisma!.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Tenant" (
        "id" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
      );
      
      CREATE TABLE IF NOT EXISTS "Lead" (
        "id" TEXT NOT NULL,
        "tenantId" TEXT NOT NULL,
        "source" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'new',
        "payload" JSONB NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
      );
      
      CREATE TABLE IF NOT EXISTS "LeadEvent" (
        "id" TEXT NOT NULL,
        "leadId" TEXT NOT NULL,
        "tenantId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "payload" JSONB NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LeadEvent_pkey" PRIMARY KEY ("id")
      );
    `;
  }

  getPrisma(): PrismaClient {
    if (!this.prisma) {
      throw new Error('Database not started. Call start() first.');
    }
    return this.prisma;
  }

  getTestId(): string {
    return this.testId;
  }
}

// Factory function for creating test databases
export function createTestDatabase(config?: Partial<TestDatabaseConfig>): TestDatabase {
  const defaultConfig: TestDatabaseConfig = {
    database: 'tekup_test',
    username: 'test_user',
    password: 'test_password',
    port: 5432,
    ...config,
  };
  
  return new TestDatabase(defaultConfig);
}