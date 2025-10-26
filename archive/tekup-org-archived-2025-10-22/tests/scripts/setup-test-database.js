const { execSync } = require('child_process');
const { Client } = require('pg');

async function setupTestDatabase() {
  console.log('🗄️  Setting up test databases...');

  const databases = [
    'foodtruck_os_test',
    'rendetalje_os_test', 
    'essenza_pro_test',
    'mcp_studio_test'
  ];

  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });

  try {
    await client.connect();

    for (const dbName of databases) {
      try {
        // Drop database if exists
        await client.query(`DROP DATABASE IF EXISTS ${dbName}`);
        console.log(`✓ Dropped existing ${dbName}`);

        // Create database
        await client.query(`CREATE DATABASE ${dbName}`);
        console.log(`✓ Created ${dbName}`);

        // Run Prisma migrations for each database
        const appName = dbName.replace('_test', '').replace('_', '-');
        process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:5432/${dbName}`;
        
        try {
          execSync(`cd ../apps/${appName}-backend && npx prisma migrate deploy`, { 
            stdio: 'inherit',
            env: { ...process.env, DATABASE_URL: `postgresql://postgres:postgres@localhost:5432/${dbName}` }
          });
          console.log(`✓ Applied migrations to ${dbName}`);

          // Generate Prisma client
          execSync(`cd ../apps/${appName}-backend && npx prisma generate`, {
            stdio: 'inherit'
          });
          console.log(`✓ Generated Prisma client for ${appName}`);
        } catch (error) {
          console.log(`⚠️  Migration failed for ${dbName}: ${error.message}`);
        }
      } catch (error) {
        console.error(`❌ Error setting up ${dbName}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }

  console.log('✅ Test database setup completed!');
}

setupTestDatabase();
