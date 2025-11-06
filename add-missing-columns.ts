#!/usr/bin/env tsx
/**
 * Tilføjer manglende kolonner til eksisterende tables
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

async function addMissingColumns() {
  try {
    console.log("═══════════════════════════════════════════");
    console.log("   ADDING MISSING COLUMNS");
    console.log("═══════════════════════════════════════════");
    console.log("");

    await sql.unsafe(`SET search_path TO friday_ai, public`);

    // Add score to leads if missing
    console.log("Adding 'score' column to leads...");
    await sql.unsafe(`
      ALTER TABLE friday_ai.leads
      ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 0
    `);
    console.log("✅ leads.score added");

    // Add source to leads if missing
    console.log("Adding 'source' column to leads...");
    await sql.unsafe(`
      ALTER TABLE friday_ai.leads
      ADD COLUMN IF NOT EXISTS source VARCHAR(100)
    `);
    console.log("✅ leads.source added");

    // Add metadata to leads if missing
    console.log("Adding 'metadata' column to leads...");
    await sql.unsafe(`
      ALTER TABLE friday_ai.leads
      ADD COLUMN IF NOT EXISTS metadata JSONB
    `);
    console.log("✅ leads.metadata added");

    // Add lastContactedAt to leads if missing
    console.log("Adding 'lastContactedAt' column to leads...");
    await sql.unsafe(`
      ALTER TABLE friday_ai.leads
      ADD COLUMN IF NOT EXISTS "lastContactedAt" TIMESTAMP
    `);
    console.log("✅ leads.lastContactedAt added");

    console.log("");
    console.log("✅✅✅ COLUMNS ADDED! ✅✅✅");
    console.log("");

    await sql.end();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    await sql.end();
    process.exit(1);
  }
}

addMissingColumns();
