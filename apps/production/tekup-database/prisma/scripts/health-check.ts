/**
 * Database Health Check Script
 * 
 * Checks database connectivity and health
 */

import { prisma } from '../../src/client';
import { logger } from '../../src/utils/logger';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  database: {
    connected: boolean;
    version?: string;
    schemas?: string[];
    tables?: Record<string, number>;
  };
  errors: string[];
}

async function healthCheck(): Promise<HealthStatus> {
  const status: HealthStatus = {
    status: 'healthy',
    database: {
      connected: false,
    },
    errors: [],
  };

  try {
    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    status.database.connected = true;

    // Get PostgreSQL version
    const versionResult = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
    status.database.version = versionResult[0]?.version;

    // Get schemas
    const schemasResult = await prisma.$queryRaw<Array<{ schema_name: string }>>`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name IN ('vault', 'billy', 'renos', 'crm', 'flow', 'shared')
    `;
    status.database.schemas = schemasResult.map(r => r.schema_name);

    // Get table counts per schema
    status.database.tables = {};
    for (const schema of status.database.schemas || []) {
      const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = ${schema}
      `;
      status.database.tables[schema] = Number(countResult[0]?.count || 0);
    }

  } catch (error) {
    status.status = 'unhealthy';
    status.database.connected = false;
    status.errors.push(error instanceof Error ? error.message : String(error));
  }

  return status;
}

async function main() {
  console.log('🏥 Running database health check...\n');

  const health = await healthCheck();

  console.log('Status:', health.status === 'healthy' ? '✅ Healthy' : '❌ Unhealthy');
  console.log('\nDatabase:');
  console.log('  Connected:', health.database.connected ? '✅' : '❌');
  
  if (health.database.version) {
    console.log('  Version:', health.database.version.split(' ')[0]);
  }
  
  if (health.database.schemas) {
    console.log('  Schemas:', health.database.schemas.join(', '));
  }

  if (health.database.tables) {
    console.log('\nTables per schema:');
    for (const [schema, count] of Object.entries(health.database.tables)) {
      console.log(`  ${schema}: ${count} tables`);
    }
  }

  if (health.errors.length > 0) {
    console.log('\n❌ Errors:');
    health.errors.forEach(error => console.log(`  - ${error}`));
  }

  await prisma.$disconnect();

  process.exit(health.status === 'healthy' ? 0 : 1);
}

main();
