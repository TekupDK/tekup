#!/usr/bin/env tsx
/**
 * Tilføjer manglende kolonner til emails table
 */

import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.supabase" });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ DATABASE_URL not found");
  process.exit(1);
}

const url = new URL(dbUrl);
url.searchParams.delete("schema");
const cleanUrl = url.toString();

const sql = postgres(cleanUrl, {
  ssl: { rejectUnauthorized: false },
  max: 1,
});

async function fixEmailsTable() {
  try {
    console.log("═══════════════════════════════════════════");
    console.log("   FIXING EMAILS TABLE");
    console.log("═══════════════════════════════════════════");
    console.log("");

    await sql.unsafe(`SET search_path TO friday_ai, public`);

    // Check current columns
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'friday_ai'
      AND table_name = 'emails'
      ORDER BY ordinal_position
    `;

    console.log("Current columns:");
    columns.forEach((col: any) => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    console.log("");
    console.log("Adding missing columns...");

    // Add providerId if missing
    await sql.unsafe(`
      ALTER TABLE friday_ai.emails
      ADD COLUMN IF NOT EXISTS "providerId" VARCHAR(255)
    `);
    console.log("✅ providerId");

    // Add threadKey if missing
    await sql.unsafe(`
      ALTER TABLE friday_ai.emails
      ADD COLUMN IF NOT EXISTS "threadKey" VARCHAR(255)
    `);
    console.log("✅ threadKey");

    // Add customerId if missing
    await sql.unsafe(`
      ALTER TABLE friday_ai.emails
      ADD COLUMN IF NOT EXISTS "customerId" INTEGER
    `);
    console.log("✅ customerId");

    // Add emailThreadId if missing
    await sql.unsafe(`
      ALTER TABLE friday_ai.emails
      ADD COLUMN IF NOT EXISTS "emailThreadId" INTEGER
    `);
    console.log("✅ emailThreadId");

    // Add text if missing
    await sql.unsafe(`
      ALTER TABLE friday_ai.emails
      ADD COLUMN IF NOT EXISTS text TEXT
    `);
    console.log("✅ text");

    // Add html if missing
    await sql.unsafe(`
      ALTER TABLE friday_ai.emails
      ADD COLUMN IF NOT EXISTS html TEXT
    `);
    console.log("✅ html");

    // Add receivedAt if missing
    await sql.unsafe(`
      ALTER TABLE friday_ai.emails
      ADD COLUMN IF NOT EXISTS "receivedAt" TIMESTAMP
    `);
    console.log("✅ receivedAt");

    // Rename columns if needed (from old schema)
    // gmailId -> providerId (but keep both for backwards compat)
    // from_email -> fromEmail
    // to_email -> toEmail

    console.log("");
    console.log("✅✅✅ EMAILS TABLE FIXED! ✅✅✅");
    console.log("");

    // Show final columns
    const finalColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'friday_ai'
      AND table_name = 'emails'
      ORDER BY ordinal_position
    `;

    console.log("Final columns:");
    finalColumns.forEach((col: any) => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    console.log("");
    await sql.end();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    await sql.end();
    process.exit(1);
  }
}

fixEmailsTable();
