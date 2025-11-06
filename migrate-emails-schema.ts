#!/usr/bin/env tsx
/**
 * Migrerer emails table til at matche Drizzle schema
 * Renamer kolonner fra snake_case til camelCase
 * Tilføjer manglende kolonner
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

async function migrateEmailsSchema() {
  try {
    console.log("═══════════════════════════════════════════");
    console.log("   MIGRERER EMAILS TABLE TIL NYTSCHEMA");
    console.log("═══════════════════════════════════════════");
    console.log("");

    await sql.unsafe(`SET search_path TO friday_ai, public`);

    // 1. Check current columns
    const columns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'friday_ai'
      AND table_name = 'emails'
      ORDER BY ordinal_position
    `;

    console.log("Current columns:");
    columns.forEach((col: any) => {
      console.log(`  - ${col.column_name}`);
    });
    console.log("");

    // 2. Tilføj manglende kolonner først
    console.log("Tilføjer manglende kolonner...");

    await sql.unsafe(`
      ALTER TABLE friday_ai.emails
      ADD COLUMN IF NOT EXISTS "providerId" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "fromEmail" VARCHAR(320),
      ADD COLUMN IF NOT EXISTS "toEmail" VARCHAR(320),
      ADD COLUMN IF NOT EXISTS "threadKey" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "customerId" INTEGER,
      ADD COLUMN IF NOT EXISTS "emailThreadId" INTEGER,
      ADD COLUMN IF NOT EXISTS text TEXT,
      ADD COLUMN IF NOT EXISTS html TEXT
    `);
    console.log("✅ Nye kolonner tilføjet");

    // 3. Kopier data fra gamle kolonner til nye
    console.log("");
    console.log("Kopierer data fra gamle kolonner...");

    // Copy gmailId -> providerId
    await sql.unsafe(`
      UPDATE friday_ai.emails
      SET "providerId" = "gmailId"
      WHERE "providerId" IS NULL AND "gmailId" IS NOT NULL
    `);
    console.log("✅ gmailId → providerId");

    // Copy from_email -> fromEmail
    await sql.unsafe(`
      UPDATE friday_ai.emails
      SET "fromEmail" = from_email
      WHERE "fromEmail" IS NULL AND from_email IS NOT NULL
    `);
    console.log("✅ from_email → fromEmail");

    // Copy to_email -> toEmail
    await sql.unsafe(`
      UPDATE friday_ai.emails
      SET "toEmail" = to_email
      WHERE "toEmail" IS NULL AND to_email IS NOT NULL
    `);
    console.log("✅ to_email → toEmail");

    // Copy threadId -> threadKey
    await sql.unsafe(`
      UPDATE friday_ai.emails
      SET "threadKey" = "threadId"
      WHERE "threadKey" IS NULL AND "threadId" IS NOT NULL
    `);
    console.log("✅ threadId → threadKey");

    // Copy body -> text and html
    await sql.unsafe(`
      UPDATE friday_ai.emails
      SET text = body, html = body
      WHERE (text IS NULL OR html IS NULL) AND body IS NOT NULL
    `);
    console.log("✅ body → text/html");

    // 4. Set NOT NULL på kritiske kolonner
    console.log("");
    console.log("Sætter NOT NULL constraints...");

    await sql.unsafe(`
      ALTER TABLE friday_ai.emails
      ALTER COLUMN "providerId" SET NOT NULL,
      ALTER COLUMN "fromEmail" SET NOT NULL,
      ALTER COLUMN "toEmail" SET NOT NULL,
      ALTER COLUMN "receivedAt" SET NOT NULL
    `);
    console.log("✅ NOT NULL constraints sat");

    // 5. Tilføj UNIQUE constraint på providerId
    console.log("");
    console.log("Tilføjer UNIQUE constraint...");

    await sql.unsafe(`
      ALTER TABLE friday_ai.emails
      DROP CONSTRAINT IF EXISTS emails_providerId_unique
    `);

    await sql.unsafe(`
      ALTER TABLE friday_ai.emails
      ADD CONSTRAINT emails_providerId_unique UNIQUE ("providerId")
    `);
    console.log("✅ UNIQUE constraint på providerId");

    // 6. Show final schema
    console.log("");
    console.log("═══════════════════════════════════════════");
    console.log("   ✅ MIGRATION KOMPLET!");
    console.log("═══════════════════════════════════════════");
    console.log("");

    const finalColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'friday_ai'
      AND table_name = 'emails'
      ORDER BY ordinal_position
    `;

    console.log("Final schema:");
    finalColumns.forEach((col: any) => {
      const nullable = col.is_nullable === "YES" ? "NULL" : "NOT NULL";
      console.log(`  - ${col.column_name} (${col.data_type}) ${nullable}`);
    });

    console.log("");
    console.log("Nu kan gamle kolonner fjernes (valgfrit):");
    console.log("  - gmailId (erstattet af providerId)");
    console.log("  - from_email (erstattet af fromEmail)");
    console.log("  - to_email (erstattet af toEmail)");
    console.log("  - threadId (erstattet af threadKey)");
    console.log("  - body (erstattet af text/html)");
    console.log(
      "  - snippet, cc, bcc, labels, isRead, isStarred, hasAttachments, sentAt"
    );
    console.log("");

    await sql.end();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error);
    await sql.end();
    process.exit(1);
  }
}

migrateEmailsSchema();
