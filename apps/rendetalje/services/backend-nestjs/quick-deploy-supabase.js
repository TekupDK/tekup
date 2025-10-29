#!/usr/bin/env node
/**
 * Quick Deploy: Push Prisma Schema directly to Supabase
 * Uses `prisma db push` which doesn't require shadow database
 */

const { execSync } = require("child_process");
const readline = require("readline");

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║     Quick Deploy: Prisma → Supabase (db push)            ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

console.log(
  "⚠️  WARNING: This will push schema changes directly to Supabase!\n"
);
console.log("📍 Target: https://oaevagdgrasfppbrxbey.supabase.co\n");
console.log("📊 Schemas to create:");
console.log("   - vault");
console.log("   - billy");
console.log("   - renos (RenOS - your data will be migrated here)");
console.log("   - crm");
console.log("   - flow");
console.log("   - shared\n");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Do you want to continue? (yes/no): ", (answer) => {
  rl.close();

  if (answer.toLowerCase() !== "yes") {
    console.log("\n❌ Deployment cancelled.\n");
    process.exit(0);
  }

  console.log("\n🚀 Pushing schema to Supabase...\n");

  try {
    // Preflight: add safe defaulted columns to avoid blocking errors
    const preSql = `
BEGIN;
CREATE SCHEMA IF NOT EXISTS renos;
ALTER TABLE IF EXISTS renos.services ADD COLUMN IF NOT EXISTS price double precision DEFAULT 0 NOT NULL;
ALTER TABLE IF EXISTS renos.services ADD COLUMN IF NOT EXISTS duration integer DEFAULT 60 NOT NULL;
ALTER TABLE IF EXISTS renos.services ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now() NOT NULL;
COMMIT;`;

    console.log(
      "➡️  Applying safe pre-migration for renos.services (idempotent)..."
    );
    execSync("npx prisma db execute --stdin --schema ./prisma/schema.prisma", {
      stdio: ["pipe", "inherit", "inherit"],
      env: {
        ...process.env,
        DATABASE_URL:
          process.env.DATABASE_URL ||
          "postgresql://postgres:Habibie12345%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?sslmode=require",
      },
      input: preSql,
    });

    // Push schema directly to database
    execSync("npx prisma db push --skip-generate", {
      stdio: "inherit",
      env: {
        ...process.env,
        // Prefer direct connection over pooler for DDL
        DATABASE_URL:
          process.env.DATABASE_URL ||
          "postgresql://postgres:Habibie12345%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres?sslmode=require",
      },
    });

    console.log("\n✅ Schema pushed successfully!\n");

    console.log("📋 Next Steps:\n");
    console.log("1. Generate Prisma Client:");
    console.log("   npm run prisma:generate\n");
    console.log("2. Migrate existing data:");
    console.log("   node migrate-data-to-renos.js\n");
    console.log("3. Test backend:");
    console.log("   npm run start:dev\n");
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    console.log("\n💡 Troubleshooting:");
    console.log("   - Check DATABASE_URL in .env");
    console.log("   - Verify Supabase connection");
    console.log("   - Check schema.prisma syntax\n");
    process.exit(1);
  }
});
