#!/usr/bin/env node
/**
 * Deploy Prisma Schema to Supabase
 * Generates SQL and provides deployment instructions
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║     Deploy Prisma Schema to Supabase                     ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

console.log("📋 Step 1: Generating Prisma Client...\n");

try {
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("\n✅ Prisma Client generated successfully\n");
} catch (error) {
  console.error("❌ Failed to generate Prisma Client:", error.message);
  process.exit(1);
}

console.log("📋 Step 2: Creating migration SQL...\n");

try {
  // Create migrations directory if it doesn't exist
  const migrationsDir = path.join(__dirname, "prisma", "migrations");
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  // Generate migration SQL
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .split("T")[0];
  const migrationName = `${timestamp}_init_tekup_multi_schema`;

  console.log(`📝 Creating migration: ${migrationName}\n`);

  execSync(`npx prisma migrate dev --name ${migrationName} --create-only`, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });

  console.log("\n✅ Migration SQL created\n");

  // Find the latest migration directory
  const migrations = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.startsWith(timestamp))
    .sort()
    .reverse();

  if (migrations.length === 0) {
    throw new Error("No migration files found");
  }

  const latestMigration = migrations[0];
  const migrationSqlPath = path.join(
    migrationsDir,
    latestMigration,
    "migration.sql"
  );

  if (!fs.existsSync(migrationSqlPath)) {
    throw new Error(`Migration SQL file not found: ${migrationSqlPath}`);
  }

  const migrationSql = fs.readFileSync(migrationSqlPath, "utf8");

  console.log("═".repeat(60));
  console.log("📊 DEPLOYMENT INSTRUCTIONS");
  console.log("═".repeat(60));
  console.log("\n🌐 Step 3: Deploy to Supabase\n");
  console.log("1. Open Supabase Dashboard:");
  console.log(
    "   https://supabase.com/dashboard/project/oaevagdgrasfppbrxbey\n"
  );
  console.log("2. Go to: SQL Editor → New Query\n");
  console.log("3. Copy the migration SQL from:");
  console.log(`   ${migrationSqlPath}\n`);
  console.log('4. Paste into SQL Editor and click "Run"\n');
  console.log("5. Verify schemas created:");
  console.log("   - vault");
  console.log("   - billy");
  console.log("   - renos ✨ (RenOS data)");
  console.log("   - crm");
  console.log("   - flow");
  console.log("   - shared\n");
  console.log("═".repeat(60));

  console.log("\n📄 Migration SQL Preview (first 50 lines):\n");
  console.log(migrationSql.split("\n").slice(0, 50).join("\n"));
  console.log("\n... (see full SQL in migration file)\n");

  console.log("✅ Ready to deploy! Follow instructions above.\n");
} catch (error) {
  console.error("\n❌ Error creating migration:", error.message);

  if (error.message.includes("P3014")) {
    console.log("\n💡 TIP: Prisma Migrate requires a shadow database.");
    console.log("   For Supabase, use prisma db push instead:\n");
    console.log("   npx prisma db push --skip-generate\n");
  }

  process.exit(1);
}
