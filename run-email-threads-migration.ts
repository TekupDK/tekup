#!/usr/bin/env tsx
/**
 * Run the email_threads schema migration
 * This script applies the fix-email-threads-schema.sql migration
 */

import postgres from "postgres";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: ".env.supabase" });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ DATABASE_URL not found in .env.supabase");
  process.exit(1);
}

// Parse URL and remove schema parameter
const url = new URL(dbUrl);
const schemaParam = url.searchParams.get("schema");
const schemaName = schemaParam || "friday_ai";
url.searchParams.delete("schema");
const cleanUrl = url.toString();

const sql = postgres(cleanUrl, {
  ssl: { rejectUnauthorized: false },
  max: 1,
});

async function runMigration() {
  try {
    console.log("═══════════════════════════════════════════");
    console.log("   EMAIL_THREADS SCHEMA MIGRATION");
    console.log("═══════════════════════════════════════════");
    console.log(`Schema: ${schemaName}`);
    console.log("");

    // Set search path
    await sql.unsafe(`SET search_path TO ${schemaName}, public`);
    console.log("✅ Search path set");
    console.log("");

    // Check if table exists
    console.log("🔍 Checking if email_threads table exists...");
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = ${schemaName}
        AND table_name = 'email_threads'
      );
    `;

    if (!tableExists[0].exists) {
      console.log("⚠️  email_threads table doesn't exist yet");
      console.log("   This is okay if you haven't created tables yet");
      console.log(
        "   Run create-tables-directly.ts first, or the migration will create it"
      );
      console.log("");
    } else {
      console.log("✅ email_threads table exists");
      console.log("");

      // Show current columns
      console.log("📋 Current columns:");
      const currentColumns = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = ${schemaName}
        AND table_name = 'email_threads'
        ORDER BY ordinal_position;
      `;

      for (const col of currentColumns) {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      }
      console.log("");
    }

    // Read and execute migration
    console.log("🔧 Running migration...");
    const migrationPath = join(
      __dirname,
      "drizzle",
      "migrations",
      "fix-email-threads-schema.sql"
    );
    const migrationSql = readFileSync(migrationPath, "utf-8");

    // Replace 'email_threads' with schema-qualified name in the migration
    const qualifiedMigrationSql = migrationSql
      .replace(
        /ALTER TABLE email_threads/g,
        `ALTER TABLE ${schemaName}.email_threads`
      )
      .replace(/UPDATE email_threads/g, `UPDATE ${schemaName}.email_threads`);

    await sql.unsafe(qualifiedMigrationSql);
    console.log("✅ Migration executed successfully");
    console.log("");

    // Verify the result
    console.log("🔍 Verifying new schema...");
    const newColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = ${schemaName}
      AND table_name = 'email_threads'
      ORDER BY ordinal_position;
    `;

    console.log("📋 New columns:");
    for (const col of newColumns) {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    }
    console.log("");

    // Check for expected columns
    const columnNames = newColumns.map(c => c.column_name);
    const expectedColumns = [
      "id",
      "userId",
      "gmailThreadId",
      "subject",
      "participants",
      "snippet",
      "labels",
      "lastMessageAt",
      "isRead",
      "createdAt",
      "updatedAt",
    ];

    const missingColumns = expectedColumns.filter(
      col => !columnNames.includes(col)
    );
    const extraColumns = columnNames.filter(
      col => !expectedColumns.includes(col)
    );

    if (missingColumns.length > 0) {
      console.log("⚠️  Missing expected columns:");
      for (const col of missingColumns) {
        console.log(`   - ${col}`);
      }
      console.log("");
    }

    if (extraColumns.length > 0) {
      console.log("⚠️  Unexpected columns found:");
      for (const col of extraColumns) {
        console.log(`   - ${col}`);
      }
      console.log("");
    }

    if (missingColumns.length === 0 && extraColumns.length === 0) {
      console.log("✅ Schema matches Drizzle definition perfectly!");
      console.log("");
    }

    console.log("✅✅✅ MIGRATION COMPLETE! ✅✅✅");
    console.log("");
    console.log("Next steps:");
    console.log("1. Restart your application server");
    console.log("2. Test the email cache functionality");
    console.log("");

    await sql.end();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    console.error("");
    console.error("Error details:", error);
    await sql.end();
    process.exit(1);
  }
}

runMigration();
