#!/usr/bin/env tsx
/**
 * Opretter friday_ai schema og alle enum typer direkte via CLI
 * Kører SQL direkte mod Supabase
 */

import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.supabase" });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ DATABASE_URL not found in .env.supabase");
  process.exit(1);
}

// Parse URL og fjern schema parameter
const url = new URL(dbUrl);
const schemaParam = url.searchParams.get("schema");
url.searchParams.delete("schema");
const cleanUrl = url.toString();

const schemaName = schemaParam || "friday_ai";

console.log("═══════════════════════════════════════════");
console.log("   SETTING UP friday_ai SCHEMA & ENUMS");
console.log("═══════════════════════════════════════════");
console.log(`Schema: ${schemaName}`);
console.log("");

const sql = postgres(cleanUrl, {
  ssl: { rejectUnauthorized: false },
  max: 1,
});

async function setupSchemaAndEnums() {
  try {
    console.log("🔧 Step 1: Creating schema...");

    // Create schema
    await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    await sql.unsafe(`GRANT ALL ON SCHEMA ${schemaName} TO postgres`);
    await sql.unsafe(`GRANT ALL ON SCHEMA ${schemaName} TO authenticated`);
    await sql.unsafe(`GRANT ALL ON SCHEMA ${schemaName} TO service_role`);
    console.log("✅ Schema created");

    // Set search path
    await sql.unsafe(`SET search_path TO ${schemaName}, public`);
    console.log("✅ Search path set");

    console.log("");
    console.log("🔧 Step 2: Creating enum types...");

    // Define all enums
    const enums = [
      { name: "user_role", values: ["user", "admin"] },
      { name: "message_role", values: ["user", "assistant", "system"] },
      {
        name: "invoice_status",
        values: ["draft", "sent", "paid", "overdue", "cancelled"],
      },
      {
        name: "calendar_status",
        values: ["confirmed", "tentative", "cancelled"],
      },
      {
        name: "lead_status",
        values: ["new", "contacted", "qualified", "proposal", "won", "lost"],
      },
      {
        name: "customer_invoice_status",
        values: ["draft", "approved", "sent", "paid", "overdue", "voided"],
      },
      {
        name: "task_status",
        values: ["todo", "in_progress", "done", "cancelled"],
      },
      { name: "task_priority", values: ["low", "medium", "high", "urgent"] },
      {
        name: "email_pipeline_stage",
        values: [
          "needs_action",
          "venter_pa_svar",
          "i_kalender",
          "finance",
          "afsluttet",
        ],
      },
      { name: "theme", values: ["light", "dark"] },
    ];

    let created = 0;
    let existing = 0;

    for (const enumDef of enums) {
      const valuesStr = enumDef.values.map(v => `'${v}'`).join(", ");

      try {
        await sql.unsafe(`
          DO $$ BEGIN
            CREATE TYPE ${schemaName}.${enumDef.name} AS ENUM (${valuesStr});
          EXCEPTION
            WHEN duplicate_object THEN NULL;
          END $$;
        `);
        console.log(`✅ ${enumDef.name}`);
        created++;
      } catch (err: any) {
        if (
          err.message?.includes("duplicate_object") ||
          err.message?.includes("already exists")
        ) {
          console.log(`⚠️  ${enumDef.name} (already exists)`);
          existing++;
        } else {
          console.error(`❌ ${enumDef.name}: ${err.message}`);
        }
      }
    }

    console.log("");
    console.log(
      `📊 Created: ${created}, Existing: ${existing}, Total: ${enums.length}`
    );

    // Verify
    console.log("");
    console.log("🔍 Verifying enums...");
    const result = await sql`
      SELECT typname as enum_name, COUNT(*) as value_count
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = ${schemaName})
      GROUP BY typname
      ORDER BY typname;
    `;

    if (result.length > 0) {
      console.log("");
      console.log("✅ Verified enums:");
      for (const row of result) {
        console.log(`   - ${row.enum_name} (${row.value_count} values)`);
      }
    }

    console.log("");
    console.log("✅✅✅ SETUP COMPLETE! ✅✅✅");
    console.log("");
    console.log("📝 Next: Run schema push:");
    console.log("   pnpm drizzle-kit push --force");
    console.log("");

    await sql.end();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    await sql.end();
    process.exit(1);
  }
}

setupSchemaAndEnums();
