#!/usr/bin/env node
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.prod
dotenv.config({ path: path.join(__dirname, ".env.prod") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found in .env.prod");
  process.exit(1);
}

const migrationPath = path.join(
  __dirname,
  "drizzle",
  "migrations",
  "20251103_add_user_id_to_email_pipeline.sql"
);

if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Migration file not found: ${migrationPath}`);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

console.log(
  "🚀 Running SQL migration: 20251103_add_user_id_to_email_pipeline.sql"
);
console.log(
  `📍 Database: ${DATABASE_URL.split("@")[1]?.split("?")[0] || "hidden"}`
);
console.log("");

// Parse connection string and rebuild with proper SSL
const url = new URL(DATABASE_URL);
const client = new pg.Client({
  host: url.hostname,
  port: parseInt(url.port) || 5432,
  user: url.username,
  password: decodeURIComponent(url.password),
  database: url.pathname.split("/")[1],
  ssl: {
    rejectUnauthorized: false, // Supabase uses self-signed certs
  },
});

try {
  await client.connect();
  console.log("✅ Connected to database");

  // Check if tables exist first
  const tableCheck = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'friday_ai' 
    AND table_name IN ('email_pipeline_state', 'email_pipeline_transitions')
  `);

  if (tableCheck.rows.length === 0) {
    console.log(
      "⚠️  Pipeline tables do not exist yet. Creating tables first..."
    );
    console.log(
      "   Run: pnpm db:push OR docker-compose up -d to create tables"
    );
    process.exit(0);
  }

  console.log(`✅ Found ${tableCheck.rows.length} pipeline tables`);

  // Execute migration
  await client.query(migrationSQL);
  console.log("✅ Migration executed successfully");

  // Verify columns exist
  const result = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'friday_ai' 
    AND table_name = 'email_pipeline_state' 
    AND column_name = 'user_id'
  `);

  if (result.rows.length > 0) {
    console.log("✅ Verified: user_id column exists in email_pipeline_state");
    console.log(`   Type: ${result.rows[0].data_type}`);
  } else {
    console.warn("⚠️  Warning: Could not verify user_id column");
  }

  // Check indexes
  const indexResult = await client.query(`
    SELECT indexname 
    FROM pg_indexes 
    WHERE schemaname = 'friday_ai' 
    AND tablename IN ('email_pipeline_state', 'email_pipeline_transitions')
    AND indexname LIKE '%user%'
  `);

  console.log(`✅ Found ${indexResult.rows.length} user-related indexes:`);
  indexResult.rows.forEach(row => {
    console.log(`   - ${row.indexname}`);
  });

  console.log("");
  console.log("🎉 Migration complete! Next steps:");
  console.log(
    "   1. Rebuild container: docker-compose build --no-cache friday-ai"
  );
  console.log("   2. Restart: docker-compose up -d friday-ai");
} catch (error) {
  console.error("❌ Migration failed:", error.message);
  if (error.code) {
    console.error(`   Error code: ${error.code}`);
  }
  process.exit(1);
} finally {
  await client.end();
}
