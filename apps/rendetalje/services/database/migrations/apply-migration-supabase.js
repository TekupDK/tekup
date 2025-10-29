/**
 * Apply Subcontractor Management Migration to Supabase
 * Run: node apply-migration-supabase.js
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// Load environment variables
const envPath = path.join(__dirname, "../../backend-nestjs/.env");
const envContent = fs.readFileSync(envPath, "utf8");

const getEnvValue = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match ? match[1].trim() : null;
};

const SUPABASE_URL = getEnvValue("SUPABASE_URL");
const DATABASE_URL = getEnvValue("DATABASE_URL");

if (!SUPABASE_URL && !DATABASE_URL) {
  console.error("❌ Neither SUPABASE_URL nor DATABASE_URL found in .env");
  process.exit(1);
}

console.log("🚀 Applying Subcontractor Management Migration");
console.log(`📁 Target: ${SUPABASE_URL || DATABASE_URL}`);

// Read migration SQL
const sqlPath = path.join(__dirname, "001_subcontractor_schema.sql");
const sqlContent = fs.readFileSync(sqlPath, "utf8");

console.log(`  ✅ Loaded migration file (${sqlContent.length} bytes)`);

// For Supabase, we'll use postgres:// connection via pg library
// Install if needed: npm install pg
let pg;
try {
  pg = require("pg");
} catch (err) {
  console.error("❌ pg library not found. Installing...");
  const { execSync } = require("child_process");
  execSync("npm install pg", {
    stdio: "inherit",
    cwd: path.join(__dirname, "../.."),
  });
  pg = require("pg");
}

const { Client } = pg;

// Convert Supabase URL to postgres connection if needed
let connectionString = DATABASE_URL;
if (!connectionString && SUPABASE_URL) {
  // Extract project ref from Supabase URL
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
  console.log(`  ℹ️ Supabase project: ${projectRef}`);
  console.log(`  ⚠️ Direct SQL execution requires connection pooler URL`);
  console.log(`  📋 Please run this SQL manually in Supabase SQL Editor:`);
  console.log(`  🔗 ${SUPABASE_URL}/project/${projectRef}/sql/new`);
  console.log("");
  console.log("Or provide DATABASE_URL with direct postgres:// connection");
  process.exit(1);
}

async function runMigration() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("  ✅ Connected to database");

    console.log("  📊 Executing migration...");
    await client.query(sqlContent);

    console.log("");
    console.log("✅ Migration completed successfully!");
    console.log("");
    console.log("📋 Created:");
    console.log(
      "  - 9 tables (subcontractors, services, task_assignments, etc.)"
    );
    console.log("  - 17 indexes for performance");
    console.log("  - 12 RLS policies");
    console.log("  - 2 helper views");
    console.log("");
    console.log("🎯 Next steps:");
    console.log("  1. Generate VAPID keys: npx web-push generate-vapid-keys");
    console.log("  2. Create Supabase Storage bucket: subcontractor-documents");
    console.log("  3. Verify tables: SELECT * FROM subcontractors LIMIT 1;");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
