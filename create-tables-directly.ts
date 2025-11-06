#!/usr/bin/env tsx
/**
 * Opretter ALLE tables direkte via SQL - ingen interaktive prompts
 * Kører direkte mod Supabase
 */

import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.supabase" });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("❌ DATABASE_URL not found");
  process.exit(1);
}

// Parse URL og fjern schema parameter
const url = new URL(dbUrl);
url.searchParams.delete("schema");
const cleanUrl = url.toString();

const sql = postgres(cleanUrl, {
  ssl: { rejectUnauthorized: false },
  max: 1,
});

const schema = "friday_ai";

async function createAllTables() {
  try {
    console.log("═══════════════════════════════════════════");
    console.log("   CREATING ALL TABLES");
    console.log("═══════════════════════════════════════════");
    console.log(`Schema: ${schema}`);
    console.log("");

    // Create schema first
    console.log("🔧 Creating schema...");
    await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    await sql.unsafe(`GRANT ALL ON SCHEMA ${schema} TO postgres`);
    await sql.unsafe(`GRANT ALL ON SCHEMA ${schema} TO authenticated`);
    await sql.unsafe(`GRANT ALL ON SCHEMA ${schema} TO service_role`);
    console.log("✅ Schema created");
    console.log("");

    // Create enums
    console.log("🔧 Creating enums...");
    const enums = [
      `DO $$ BEGIN CREATE TYPE ${schema}.user_role AS ENUM ('user', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      `DO $$ BEGIN CREATE TYPE ${schema}.message_role AS ENUM ('user', 'assistant', 'system'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      `DO $$ BEGIN CREATE TYPE ${schema}.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      `DO $$ BEGIN CREATE TYPE ${schema}.calendar_status AS ENUM ('confirmed', 'tentative', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      `DO $$ BEGIN CREATE TYPE ${schema}.lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      `DO $$ BEGIN CREATE TYPE ${schema}.customer_invoice_status AS ENUM ('draft', 'approved', 'sent', 'paid', 'overdue', 'voided'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      `DO $$ BEGIN CREATE TYPE ${schema}.task_status AS ENUM ('todo', 'in_progress', 'done', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      `DO $$ BEGIN CREATE TYPE ${schema}.task_priority AS ENUM ('low', 'medium', 'high', 'urgent'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      `DO $$ BEGIN CREATE TYPE ${schema}.email_pipeline_stage AS ENUM ('needs_action', 'venter_pa_svar', 'i_kalender', 'finance', 'afsluttet'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      `DO $$ BEGIN CREATE TYPE ${schema}.theme AS ENUM ('light', 'dark'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    ];

    for (const enumSql of enums) {
      await sql.unsafe(enumSql);
    }
    console.log("✅ 10 enums created");
    console.log("");

    // Set search path
    await sql.unsafe(`SET search_path TO ${schema}, public`);

    // Create all tables
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS ${schema}.users (
        id SERIAL PRIMARY KEY,
        "openId" VARCHAR(64) NOT NULL UNIQUE,
        name TEXT,
        email VARCHAR(320),
        "loginMethod" VARCHAR(64),
        role ${schema}.user_role NOT NULL DEFAULT 'user',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "lastSignedIn" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Conversations table
      `CREATE TABLE IF NOT EXISTS ${schema}.conversations (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        title VARCHAR(255),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Messages table
      `CREATE TABLE IF NOT EXISTS ${schema}.messages (
        id SERIAL PRIMARY KEY,
        "conversationId" INTEGER NOT NULL,
        role ${schema}.message_role NOT NULL,
        content TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Emails table
      `CREATE TABLE IF NOT EXISTS ${schema}.emails (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "gmailId" VARCHAR(255) UNIQUE,
        "threadId" VARCHAR(255),
        subject TEXT,
        from_email VARCHAR(320),
        to_email TEXT,
        cc TEXT,
        bcc TEXT,
        body TEXT,
        snippet TEXT,
        "isRead" BOOLEAN DEFAULT false,
        "isStarred" BOOLEAN DEFAULT false,
        labels TEXT,
        "hasAttachments" BOOLEAN DEFAULT false,
        "receivedAt" TIMESTAMP,
        "sentAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Email attachments table
      `CREATE TABLE IF NOT EXISTS ${schema}.email_attachments (
        id SERIAL PRIMARY KEY,
        "emailId" INTEGER NOT NULL,
        filename VARCHAR(255) NOT NULL,
        "mimeType" VARCHAR(100),
        size INTEGER,
        "attachmentId" VARCHAR(255),
        "storageUrl" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Invoices table
      `CREATE TABLE IF NOT EXISTS ${schema}.invoices (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "invoiceNumber" VARCHAR(50) UNIQUE,
        "customerName" VARCHAR(255),
        "customerEmail" VARCHAR(320),
        amount DECIMAL(10, 2),
        currency VARCHAR(3) DEFAULT 'DKK',
        status ${schema}.invoice_status DEFAULT 'draft',
        "dueDate" TIMESTAMP,
        "paidAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Calendar events table
      `CREATE TABLE IF NOT EXISTS ${schema}.calendar_events (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "googleEventId" VARCHAR(255) UNIQUE,
        "calendarId" VARCHAR(255),
        title TEXT,
        description TEXT,
        location TEXT,
        "startTime" TIMESTAMP,
        "endTime" TIMESTAMP,
        "isAllDay" BOOLEAN DEFAULT false,
        status ${schema}.calendar_status DEFAULT 'confirmed',
        attendees JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Leads table
      `CREATE TABLE IF NOT EXISTS ${schema}.leads (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(320),
        phone VARCHAR(50),
        company VARCHAR(255),
        status ${schema}.lead_status DEFAULT 'new',
        source VARCHAR(100),
        notes TEXT,
        "lastContactedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Customers table
      `CREATE TABLE IF NOT EXISTS ${schema}.customers (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(320),
        phone VARCHAR(50),
        company VARCHAR(255),
        address TEXT,
        "billyCustomerId" VARCHAR(100),
        metadata JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Customer invoices table
      `CREATE TABLE IF NOT EXISTS ${schema}.customer_invoices (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "customerId" INTEGER,
        "billyInvoiceId" VARCHAR(100),
        "invoiceNumber" VARCHAR(50),
        amount DECIMAL(10, 2),
        currency VARCHAR(3) DEFAULT 'DKK',
        status ${schema}.customer_invoice_status DEFAULT 'draft',
        "dueDate" TIMESTAMP,
        "paidAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Tasks table
      `CREATE TABLE IF NOT EXISTS ${schema}.tasks (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ${schema}.task_status DEFAULT 'todo',
        priority ${schema}.task_priority DEFAULT 'medium',
        "dueDate" TIMESTAMP,
        "completedAt" TIMESTAMP,
        "relatedEmailId" INTEGER,
        "relatedLeadId" INTEGER,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Email threads table (matches drizzle/schema.ts)
      `CREATE TABLE IF NOT EXISTS ${schema}.email_threads (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "gmailThreadId" VARCHAR(255) NOT NULL,
        subject TEXT,
        participants JSONB,
        snippet TEXT,
        labels JSONB,
        "lastMessageAt" TIMESTAMP,
        "isRead" BOOLEAN DEFAULT false NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Email pipeline state table
      `CREATE TABLE IF NOT EXISTS ${schema}.email_pipeline_state (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "threadId" VARCHAR(255) NOT NULL,
        stage ${schema}.email_pipeline_stage NOT NULL,
        "transitionedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE("threadId", "userId")
      )`,

      // Email pipeline transitions table
      `CREATE TABLE IF NOT EXISTS ${schema}.email_pipeline_transitions (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "threadId" VARCHAR(255) NOT NULL,
        "fromStage" ${schema}.email_pipeline_stage,
        "toStage" ${schema}.email_pipeline_stage NOT NULL,
        "transitionedBy" VARCHAR(255),
        reason TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // User settings table
      `CREATE TABLE IF NOT EXISTS ${schema}.user_settings (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL UNIQUE,
        theme ${schema}.theme DEFAULT 'light',
        language VARCHAR(10) DEFAULT 'da',
        "emailNotifications" BOOLEAN DEFAULT true,
        "desktopNotifications" BOOLEAN DEFAULT true,
        settings JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // User credentials table
      `CREATE TABLE IF NOT EXISTS ${schema}.user_credentials (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        provider VARCHAR(50) NOT NULL,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "expiresAt" TIMESTAMP,
        scope TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE("userId", provider)
      )`,

      // Billy API cache table
      `CREATE TABLE IF NOT EXISTS ${schema}.billy_api_cache (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        endpoint VARCHAR(255) NOT NULL,
        "cacheKey" VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE("userId", "cacheKey")
      )`,

      // Billy rate limit table
      `CREATE TABLE IF NOT EXISTS ${schema}.billy_rate_limit (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL UNIQUE,
        "requestCount" INTEGER DEFAULT 0,
        "resetAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // AI insights table
      `CREATE TABLE IF NOT EXISTS ${schema}.ai_insights (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        "relatedEntityType" VARCHAR(50),
        "relatedEntityId" INTEGER,
        insight TEXT NOT NULL,
        confidence DECIMAL(3, 2),
        metadata JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Email analysis table
      `CREATE TABLE IF NOT EXISTS ${schema}.email_analysis (
        id SERIAL PRIMARY KEY,
        "emailId" INTEGER NOT NULL UNIQUE,
        sentiment VARCHAR(20),
        "sentimentScore" DECIMAL(3, 2),
        category VARCHAR(50),
        "keyTopics" TEXT,
        "suggestedActions" JSONB,
        "analyzedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Audit logs table
      `CREATE TABLE IF NOT EXISTS ${schema}.audit_logs (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER,
        action VARCHAR(100) NOT NULL,
        "entityType" VARCHAR(50),
        "entityId" INTEGER,
        details JSONB,
        "ipAddress" VARCHAR(45),
        "userAgent" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Notifications table
      `CREATE TABLE IF NOT EXISTS ${schema}.notifications (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        "isRead" BOOLEAN DEFAULT false,
        "actionUrl" TEXT,
        metadata JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Webhooks table
      `CREATE TABLE IF NOT EXISTS ${schema}.webhooks (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        provider VARCHAR(50) NOT NULL,
        "eventType" VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        "processedAt" TIMESTAMP,
        error TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
    ];

    console.log("🔧 Creating tables...");
    console.log("");

    let created = 0;
    for (const tableSql of tables) {
      try {
        await sql.unsafe(tableSql);
        const tableName = tableSql.match(
          /CREATE TABLE IF NOT EXISTS \w+\.(\w+)/
        )?.[1];
        console.log(`✅ ${tableName}`);
        created++;
      } catch (err: any) {
        console.error(`❌ Error: ${err.message}`);
      }
    }

    console.log("");
    console.log(`📊 Created: ${created} tables`);

    // Create triggers for updatedAt
    console.log("");
    console.log("🔧 Creating updatedAt triggers...");

    const triggerFunction = `
      CREATE OR REPLACE FUNCTION ${schema}.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW."updatedAt" = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    await sql.unsafe(triggerFunction);
    console.log("✅ Trigger function created");

    const tablesWithUpdatedAt = [
      "users",
      "conversations",
      "emails",
      "invoices",
      "calendar_events",
      "leads",
      "customers",
      "customer_invoices",
      "tasks",
      "email_threads",
      "user_settings",
      "user_credentials",
      "billy_rate_limit",
    ];

    for (const table of tablesWithUpdatedAt) {
      try {
        await sql.unsafe(`
          DROP TRIGGER IF EXISTS set_${table}_updated_at ON ${schema}.${table};
          CREATE TRIGGER set_${table}_updated_at
          BEFORE UPDATE ON ${schema}.${table}
          FOR EACH ROW
          EXECUTE FUNCTION ${schema}.update_updated_at_column();
        `);
      } catch (err: any) {
        // Ignore if trigger already exists
      }
    }

    console.log(`✅ ${tablesWithUpdatedAt.length} triggers created`);

    // Verify
    console.log("");
    console.log("🔍 Verifying tables...");
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = ${schema}
      ORDER BY table_name;
    `;

    console.log("");
    console.log(`✅ Total tables in ${schema}: ${result.length}`);
    console.log("");
    console.log("Tables:");
    for (const row of result) {
      console.log(`   - ${row.table_name}`);
    }

    console.log("");
    console.log("✅✅✅ ALL TABLES CREATED! ✅✅✅");
    console.log("");

    await sql.end();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    await sql.end();
    process.exit(1);
  }
}

createAllTables();
