#!/usr/bin/env tsx
/**
 * Tilføjer fromEmail og toEmail kolonner (alias for from_email og to_email)
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

async function addAliasColumns() {
  try {
    console.log("Adding fromEmail and toEmail alias columns...");

    await sql.unsafe(`SET search_path TO friday_ai, public`);

    // Add fromEmail (copy from from_email)
    await sql.unsafe(`
      ALTER TABLE friday_ai.emails
      ADD COLUMN IF NOT EXISTS "fromEmail" VARCHAR(320)
    `);

    // Add toEmail (copy from to_email)
    await sql.unsafe(`
      ALTER TABLE friday_ai.emails
      ADD COLUMN IF NOT EXISTS "toEmail" TEXT
    `);

    // Copy data from old columns to new
    await sql.unsafe(`
      UPDATE friday_ai.emails
      SET "fromEmail" = from_email, "toEmail" = to_email
      WHERE "fromEmail" IS NULL OR "toEmail" IS NULL
    `);

    console.log("✅ fromEmail and toEmail columns added and populated");

    await sql.end();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    await sql.end();
    process.exit(1);
  }
}

addAliasColumns();
