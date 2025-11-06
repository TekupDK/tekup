#!/usr/bin/env tsx
/**
 * Tjekker emails table og schema
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

async function checkEmailsTable() {
  try {
    console.log("═══════════════════════════════════════════");
    console.log("   CHECKING EMAILS TABLE");
    console.log("═══════════════════════════════════════════");
    console.log("");

    // Set search path
    await sql.unsafe(`SET search_path TO friday_ai, public`);
    console.log("✅ Search path set to friday_ai");
    console.log("");

    // Check if table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'friday_ai'
        AND table_name = 'emails'
      )
    `;
    console.log("Table exists:", tableExists[0].exists);
    console.log("");

    // Count rows
    const count = await sql.unsafe(`SELECT COUNT(*) FROM friday_ai.emails`);
    console.log("📧 Total emails:", count[0].count);
    console.log("");

    // Show sample data
    const sample = await sql.unsafe(`
      SELECT id, "userId", "providerId", "fromEmail", "toEmail", subject, "receivedAt"
      FROM friday_ai.emails
      LIMIT 3
    `);

    console.log("Sample data:");
    sample.forEach((row: any) => {
      console.log("  -", {
        id: row.id,
        userId: row.userId,
        providerId: row.providerId?.substring(0, 20) + "...",
        fromEmail: row.fromEmail,
        toEmail: row.toEmail,
        subject: row.subject?.substring(0, 40) + "...",
      });
    });
    console.log("");

    // Test exact query that's failing
    console.log("Testing exact query with userId = 1...");
    try {
      const testQuery = await sql.unsafe(`
        SELECT "id", "userId", "providerId", "fromEmail", "toEmail", "subject", "text", "html", "receivedAt", "threadKey", "customerId", "emailThreadId", "createdAt", "updatedAt"
        FROM friday_ai.emails
        WHERE "userId" = 1
        ORDER BY "receivedAt" DESC
        LIMIT 50
      `);
      console.log(
        "✅ Query SUCCESS! Found",
        testQuery.length,
        "emails for userId=1"
      );
      console.log("");

      if (testQuery.length > 0) {
        console.log("First email:");
        console.log("  - From:", testQuery[0].fromEmail);
        console.log("  - To:", testQuery[0].toEmail);
        console.log("  - Subject:", testQuery[0].subject?.substring(0, 50));
        console.log("  - Received:", testQuery[0].receivedAt);
      }
    } catch (queryError: any) {
      console.error("❌ Query FAILED:", queryError.message);
      console.error(queryError);
    }

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

checkEmailsTable();
