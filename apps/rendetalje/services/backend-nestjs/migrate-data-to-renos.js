#!/usr/bin/env node
/**
 * Migrate Data from Old Schema to New Renos Schema
 * Moves customers and leads from public to renos schema
 */

const { createClient } = require("@supabase/supabase-js");
const { PrismaClient } = require("@prisma/client");

const SUPABASE_URL = "https://oaevagdgrasfppbrxbey.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg3Nzc2NCwiZXhwIjoyMDc1NDUzNzY0fQ.94lDERK4Enw8YTH_OtE9BpQhQWs8fg_7GZQGnYS8rNo";

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║     Migrate Data: Old Schema → Renos Schema              ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

async function migrateData() {
  // Initialize clients
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const prisma = new PrismaClient();

  try {
    console.log("📊 Step 1: Fetching existing data from public schema...\n");

    // Fetch customers from old schema
    const { data: oldCustomers, error: custError } = await supabase
      .from("customers")
      .select("*");

    if (custError) {
      throw new Error(`Failed to fetch customers: ${custError.message}`);
    }

    console.log(`✅ Found ${oldCustomers?.length || 0} customers\n`);

    // Fetch leads from old schema
    const { data: oldLeads, error: leadError } = await supabase
      .from("leads")
      .select("*");

    if (leadError) {
      console.log(`⚠️  No leads found in old schema (${leadError.message})`);
    } else {
      console.log(`✅ Found ${oldLeads?.length || 0} leads\n`);
    }

    console.log("📊 Step 2: Migrating to renos schema...\n");

    let customersCreated = 0;
    let leadsCreated = 0;

    // Migrate customers
    if (oldCustomers && oldCustomers.length > 0) {
      for (const customer of oldCustomers) {
        try {
          await prisma.renosCustomer.create({
            data: {
              id: customer.id,
              name: customer.name || "Unknown",
              email: customer.email,
              phone: customer.phone,
              address: customer.address,
              companyName: customer.company_name,
              notes: customer.notes,
              status: customer.status || "active",
              tags: Array.isArray(customer.tags)
                ? customer.tags
                : typeof customer.tags === "string"
                  ? (() => {
                      try {
                        const v = JSON.parse(customer.tags);
                        return Array.isArray(v) ? v : [];
                      } catch {
                        return [];
                      }
                    })()
                  : [],
              totalLeads: customer.total_leads || 0,
              totalBookings: customer.total_bookings || 0,
              totalRevenue: customer.total_revenue || 0,
              lastContactAt: customer.last_contact_at
                ? new Date(customer.last_contact_at)
                : null,
            },
          });
          customersCreated++;
          console.log(`  ✅ Migrated customer: ${customer.name}`);
        } catch (error) {
          if (error.code === "P2002") {
            console.log(`  ⚠️  Customer already exists: ${customer.name}`);
          } else {
            console.error(
              `  ❌ Failed to migrate ${customer.name}:`,
              error.message
            );
          }
        }
      }
    }

    // Migrate leads
    if (oldLeads && oldLeads.length > 0) {
      for (const lead of oldLeads) {
        try {
          await prisma.renosLead.create({
            data: {
              id: lead.id,
              sessionId: lead.session_id,
              customerId: lead.customer_id,
              source: lead.source,
              name: lead.name,
              email: lead.email,
              phone: lead.phone,
              address: lead.address,
              squareMeters: lead.square_meters,
              rooms: lead.rooms,
              taskType: lead.task_type,
              preferredDates: Array.isArray(lead.preferred_dates)
                ? lead.preferred_dates
                : typeof lead.preferred_dates === "string"
                  ? (() => {
                      try {
                        const v = JSON.parse(lead.preferred_dates);
                        return Array.isArray(v) ? v : [];
                      } catch {
                        return [];
                      }
                    })()
                  : [],
              status: lead.status || "new",
              emailThreadId: lead.email_thread_id,
              followUpAttempts: lead.follow_up_attempts || 0,
              lastFollowUpDate: lead.last_follow_up_date
                ? new Date(lead.last_follow_up_date)
                : null,
              companyName: lead.company_name,
              industry: lead.industry,
              estimatedSize: lead.estimated_size,
              estimatedValue: lead.estimated_value,
              enrichmentData: lead.enrichment_data,
              lastEnriched: lead.last_enriched
                ? new Date(lead.last_enriched)
                : null,
              score: lead.score || 0,
              priority: lead.priority || "medium",
            },
          });
          leadsCreated++;
          console.log(`  ✅ Migrated lead: ${lead.name || lead.email}`);
        } catch (error) {
          if (error.code === "P2002") {
            console.log(
              `  ⚠️  Lead already exists: ${lead.name || lead.email}`
            );
          } else {
            console.error(`  ❌ Failed to migrate lead:`, error.message);
          }
        }
      }
    }

    console.log("\n" + "═".repeat(60));
    console.log("📊 MIGRATION SUMMARY");
    console.log("═".repeat(60));
    console.log(
      `\n✅ Customers migrated: ${customersCreated}/${oldCustomers?.length || 0}`
    );
    console.log(`✅ Leads migrated: ${leadsCreated}/${oldLeads?.length || 0}`);
    console.log("\n🎉 Migration complete!\n");

    console.log("📋 Next Steps:");
    console.log("1. Verify data in Supabase dashboard");
    console.log("2. Test backend API endpoints");
    console.log("3. Archive old tables (optional)\n");
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
