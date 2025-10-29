#!/usr/bin/env node
/**
 * Verify Supabase Database Status for RenOS
 * Tests connection and checks for required tables/schemas
 */

const { createClient } = require("@supabase/supabase-js");

// Credentials from tekup-secrets
const SUPABASE_URL = "https://oaevagdgrasfppbrxbey.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg3Nzc2NCwiZXhwIjoyMDc1NDUzNzY0fQ.94lDERK4Enw8YTH_OtE9BpQhQWs8fg_7GZQGnYS8rNo";

console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║     RenOS Database Verification (Supabase)                ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

console.log("📍 Supabase URL:", SUPABASE_URL);
console.log("🔑 Using service role key");
console.log("");

async function verifyDatabase() {
  try {
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("✅ Supabase client initialized\n");

    // NOTE: Using renos schema (not public)
    console.log("📌 Note: Checking renos schema tables\n");

    const renos = supabase.schema("renos");

    // Test 1: Check customers table
    console.log("🔍 Test 1: Checking customers table...");
    const {
      data: customers,
      error: custError,
      count: custCount,
    } = await renos
      .from("customers")
      .select("id, name, email", { count: "exact" })
      .limit(5);

    if (custError) {
      console.log("❌ Error:", custError.message);
    } else {
      console.log(
        `✅ Customers table exists! Found ${custCount || 0} customers`
      );
      if (customers && customers.length > 0) {
        console.log("   Sample:", customers[0].name);
      }
    }
    console.log("");

    // Test 2: Check leads table (renamed from jobs)
    console.log("🔍 Test 2: Checking leads table...");
    const {
      data: leads,
      error: leadError,
      count: leadCount,
    } = await renos
      .from("leads")
      .select("id, name, email, status", { count: "exact" })
      .limit(5);

    if (leadError) {
      console.log("❌ Error:", leadError.message);
    } else {
      console.log(`✅ Leads table exists! Found ${leadCount || 0} leads`);
      if (leads && leads.length > 0) {
        console.log("   Sample:", leads[0].name, "-", leads[0].status);
      }
    }
    console.log("");

    // Test 3: Check bookings table
    console.log("🔍 Test 3: Checking bookings table...");
    const {
      data: bookings,
      error: bookError,
      count: bookCount,
    } = await renos
      .from("bookings")
      .select("id, status, scheduled_at", { count: "exact" })
      .limit(5);

    if (bookError) {
      console.log("❌ Error:", bookError.message);
    } else {
      console.log(`✅ Bookings table exists! Found ${bookCount || 0} bookings`);
      if (bookings && bookings.length > 0) {
        console.log(
          "   Sample:",
          bookings[0].service_type,
          "-",
          bookings[0].status
        );
      }
    }
    console.log("");

    // Test 4: Check users table
    console.log("🔍 Test 4: Checking users table...");
    const {
      data: users,
      error: userError,
      count: userCount,
    } = await renos
      .from("users")
      .select("id, email, name, role", { count: "exact" })
      .limit(5);

    if (userError) {
      console.log("❌ Error:", userError.message);
    } else {
      console.log(`✅ Users table exists! Found ${userCount || 0} users`);
      if (users && users.length > 0) {
        console.log("   Sample:", users[0].email, "(", users[0].role, ")");
      }
    }
    console.log("");

    // Test 5: Check team_members table
    console.log("🔍 Test 5: Checking team_members table...");
    const {
      data: team,
      error: teamError,
      count: teamCount,
    } = await renos
      .from("team_members")
      .select("id, employee_id, is_active", { count: "exact" })
      .limit(5);

    if (teamError) {
      console.log("❌ Error:", teamError.message);
    } else {
      console.log(
        `✅ Team members table exists! Found ${teamCount || 0} team members`
      );
      if (team && team.length > 0) {
        console.log("   Sample employee ID:", team[0].employee_id);
      }
    }
    console.log("");

    // Test 6: Check time_entries table
    console.log("🔍 Test 6: Checking time_entries table...");
    const {
      data: timeEntries,
      error: timeError,
      count: timeCount,
    } = await renos
      .from("time_entries")
      .select("id, start_time, end_time", { count: "exact" })
      .limit(3);

    if (timeError) {
      console.log("❌ Error:", timeError.message);
    } else {
      console.log(
        `✅ Time entries table exists! Found ${timeCount || 0} entries`
      );
    }
    console.log("");

    // Summary
    console.log("═".repeat(60));
    console.log("📊 VERIFICATION SUMMARY");
    console.log("═".repeat(60));

    const results = [
      { name: "customers", error: custError, count: custCount },
      { name: "leads", error: leadError, count: leadCount },
      { name: "bookings", error: bookError, count: bookCount },
      { name: "users", error: userError, count: userCount },
      { name: "team_members", error: teamError, count: teamCount },
      { name: "time_entries", error: timeError, count: timeCount },
    ];

    const working = results.filter((r) => !r.error).length;
    const total = results.length;

    console.log(`\n✅ Working tables: ${working}/${total}`);

    if (working === total) {
      console.log(
        "\n🎉 SUCCESS! All core RenOS tables are accessible in Supabase!"
      );
      console.log("\nNext steps:");
      console.log("  1. Backend can safely use @supabase/supabase-js");
      console.log("  2. Update .env with these credentials");
      console.log("  3. Test API endpoints with real data");
    } else {
      console.log("\n⚠️  Some tables are missing or inaccessible");
      console.log("\nTroubleshooting:");
      console.log("  1. Run schema.sql in Supabase SQL Editor");
      console.log("  2. Check Row Level Security (RLS) policies");
      console.log("  3. Verify service role key has admin access");
    }

    console.log("\n" + "═".repeat(60));
  } catch (error) {
    console.error("\n❌ FATAL ERROR:", error.message);
    console.error("\nStack trace:", error.stack);
    process.exit(1);
  }
}

verifyDatabase();
