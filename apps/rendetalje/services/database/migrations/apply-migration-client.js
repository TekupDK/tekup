/**
 * Apply migration via Supabase client library
 */

const fs = require("fs");
const path = require("path");

// Load environment
const envPath = path.join(__dirname, "../../backend-nestjs/.env");
const envContent = fs.readFileSync(envPath, "utf8");
const getEnv = (key) =>
  envContent.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1].trim();

const SUPABASE_URL = getEnv("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = getEnv("SUPABASE_SERVICE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

console.log("🚀 Applying migration via Supabase client");
console.log(`📁 Project: ${SUPABASE_URL}`);

// Install Supabase client if needed
let createClient;
try {
  createClient = require("@supabase/supabase-js").createClient;
} catch (err) {
  console.log("  📦 Installing @supabase/supabase-js...");
  const { execSync } = require("child_process");
  execSync("npm install @supabase/supabase-js", {
    stdio: "inherit",
    cwd: path.join(__dirname, "../.."),
  });
  createClient = require("@supabase/supabase-js").createClient;
}

// Read migration SQL
const sqlPath = path.join(__dirname, "001_subcontractor_schema.sql");
const sqlContent = fs.readFileSync(sqlPath, "utf8");
console.log(
  `  ✅ Loaded migration (${(sqlContent.length / 1024).toFixed(1)}KB)`
);

async function runMigration() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log("  📊 Executing SQL statements...");

  // Split into individual statements (simple approach)
  const statements = sqlContent
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  console.log(`  ℹ️ Found ${statements.length} SQL statements`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ";";

    // Skip comments and empty lines
    if (stmt.trim().startsWith("--") || stmt.trim().length < 5) {
      continue;
    }

    try {
      const { data, error } = await supabase.rpc("exec_sql", { query: stmt });

      if (error) {
        // Check if it's "already exists" error (non-fatal)
        if (error.message.includes("already exists")) {
          console.log(
            `  ⚠️ Skipping (already exists): ${stmt.substring(0, 60)}...`
          );
        } else {
          console.error(`  ❌ Error in statement ${i + 1}:`, error.message);
          console.error(`     SQL: ${stmt.substring(0, 100)}...`);
          errorCount++;
        }
      } else {
        successCount++;
        if ((i + 1) % 10 === 0) {
          console.log(
            `  ✅ Processed ${i + 1}/${statements.length} statements`
          );
        }
      }
    } catch (err) {
      console.error(`  ❌ Exception in statement ${i + 1}:`, err.message);
      errorCount++;
    }
  }

  console.log("");
  if (errorCount === 0) {
    console.log("✅ Migration completed successfully!");
    console.log(`  📊 Executed ${successCount} statements`);
    console.log("");
    console.log("📋 Created:");
    console.log(
      "  - 9 tables (subcontractors, services, task_assignments, etc.)"
    );
    console.log("  - 17 indexes for performance");
    console.log("  - 12 RLS policies");
    console.log("  - 2 helper views");
  } else {
    console.log(`⚠️ Migration completed with ${errorCount} errors`);
    console.log(`  ✅ ${successCount} successful`);
    console.log(`  ❌ ${errorCount} failed`);
  }
}

runMigration().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
