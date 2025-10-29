/**
 * Execute Subcontractor Schema Migration via Supabase REST API
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// Supabase credentials
const SUPABASE_URL = "https://oaevagdgrasfppbrxbey.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZXZhZ2RncmFzZnBwYnJ4YmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTg3Nzc2NCwiZXhwIjoyMDc1NDUzNzY0fQ.94lDERK4Enw8YTH_OtE9BpQhQWs8fg_7GZQGnYS8rNo";

console.log("🚀 Starting Supabase Migration...");
console.log(`📁 Target: ${SUPABASE_URL}`);

// Read SQL file
const sqlPath = path.join(__dirname, "001_subcontractor_schema.sql");
const sqlContent = fs.readFileSync(sqlPath, "utf8");

console.log(
  `✅ Loaded migration file (${(sqlContent.length / 1024).toFixed(1)}KB)`
);

// Split into individual statements
const statements = sqlContent
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s.length > 10 && !s.startsWith("--") && !s.match(/^\/\*/));

console.log(`ℹ️  Found ${statements.length} SQL statements\n`);

// Execute SQL via Supabase REST API
async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });

    const options = {
      hostname: "oaevagdgrasfppbrxbey.supabase.co",
      port: 443,
      path: "/rest/v1/rpc/exec_sql",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        Prefer: "return=minimal",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: `HTTP ${res.statusCode}: ${data}` });
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

// Main execution
(async () => {
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  console.log("📊 Executing statements...\n");

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];

    // Show progress
    if ((i + 1) % 5 === 0) {
      process.stdout.write(
        `  Progress: ${i + 1}/${statements.length} statements\r`
      );
    }

    try {
      const result = await executeSQL(stmt + ";");

      if (result.success) {
        successCount++;
      } else {
        // Check if it's "already exists" error (non-fatal)
        if (
          result.error &&
          (result.error.includes("already exists") ||
            result.error.includes("duplicate"))
        ) {
          skipCount++;
        } else {
          console.error(`\n❌ Error in statement ${i + 1}:`);
          console.error(`   ${stmt.substring(0, 80)}...`);
          console.error(`   ${result.error}\n`);
          errorCount++;
        }
      }
    } catch (err) {
      console.error(`\n❌ Exception in statement ${i + 1}:`, err.message, "\n");
      errorCount++;
    }
  }

  console.log("\n");

  if (errorCount === 0) {
    console.log("✅ Migration completed successfully!");
    console.log(`  📊 Executed: ${successCount} statements`);
    if (skipCount > 0) {
      console.log(`  ⚠️  Skipped: ${skipCount} (already exists)`);
    }
    console.log("");
    console.log("📋 Created:");
    console.log(
      "  - 9 tables (subcontractors, services, task_assignments, etc.)"
    );
    console.log("  - 17 indexes for performance");
    console.log("  - 12 RLS policies");
    console.log("  - 2 helper views");
    console.log("");
    console.log("🎯 Next steps:");
    console.log("  1. Generate VAPID keys: npx web-push generate-vapid-keys");
    console.log("  2. Create Supabase Storage bucket: subcontractor-documents");
    console.log("  3. Verify tables: SELECT * FROM subcontractors LIMIT 1;");
    process.exit(0);
  } else {
    console.log(`⚠️  Migration completed with errors`);
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ⚠️  Skipped: ${skipCount}`);
    console.log(`  ❌ Failed: ${errorCount}`);
    console.log("");
    console.log(
      "ℹ️  Note: Supabase REST API may not support all SQL operations."
    );
    console.log(
      "   Consider running migration manually in Supabase SQL Editor."
    );
    process.exit(1);
  }
})();
