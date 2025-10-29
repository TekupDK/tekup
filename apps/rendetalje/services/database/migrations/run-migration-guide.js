/**
 * Apply Subcontractor Management Migration
 * Uses Supabase REST API with direct SQL execution
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// Environment configuration
const envPath = path.join(__dirname, "../../backend-nestjs/.env");
const envContent = fs.readFileSync(envPath, "utf8");
const getEnv = (key) =>
  envContent.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1].trim();

const SUPABASE_URL = getEnv("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = getEnv("SUPABASE_SERVICE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env");
  process.exit(1);
}

const PROJECT_REF = SUPABASE_URL.match(/https:\/\/([^.]+)/)[1];

console.log("🚀 Subcontractor Management Migration");
console.log(`📁 Project: ${PROJECT_REF}`);
console.log(`🔗 URL: ${SUPABASE_URL}`);
console.log("");

// Read migration file
const sqlPath = path.join(__dirname, "001_subcontractor_schema.sql");
const sqlContent = fs.readFileSync(sqlPath, "utf8");
console.log(
  `✅ Loaded migration file (${(sqlContent.length / 1024).toFixed(1)}KB)`
);

// Split into manageable statements
const statements = sqlContent
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s.length > 10 && !s.startsWith("--"));

console.log(`ℹ️ Found ${statements.length} SQL statements to execute`);
console.log("");

/**
 * Execute SQL via Supabase REST API
 */
async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);

    const postData = JSON.stringify({ query: sql });

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        Prefer: "return=minimal",
      },
    };

    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (
          res.statusCode === 200 ||
          res.statusCode === 201 ||
          res.statusCode === 204
        ) {
          resolve({ success: true, data });
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

/**
 * Main migration function
 */
async function runMigration() {
  console.log(
    "⚠️ Note: Supabase REST API does not support arbitrary SQL execution"
  );
  console.log("ℹ️ This script will guide you through manual application");
  console.log("");
  console.log("📋 Migration Instructions:");
  console.log("");
  console.log(`1. Open Supabase SQL Editor:`);
  console.log(
    `   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`
  );
  console.log("");
  console.log(`2. Copy the SQL file content from:`);
  console.log(`   ${sqlPath}`);
  console.log("");
  console.log(`3. Paste into the SQL Editor`);
  console.log("");
  console.log(`4. Click 'Run' or press Ctrl+Enter`);
  console.log("");
  console.log("✅ Expected Results:");
  console.log("   - 9 new tables created");
  console.log("   - 17 indexes added");
  console.log("   - 12 RLS policies configured");
  console.log("   - 8 default services inserted");
  console.log("");
  console.log("🎯 Verification Query:");
  console.log(`   SELECT table_name FROM information_schema.tables`);
  console.log(
    `   WHERE table_schema='public' AND table_name LIKE 'subcontractor%';`
  );
  console.log("");
  console.log("📚 Documentation:");
  console.log("   - Schema: migrations/001_subcontractor_schema.sql");
  console.log(
    "   - Config: ../../backend-nestjs/.env (ENABLE_SUBCONTRACTOR_MODULE=true)"
  );
  console.log(
    "   - Guide: ../../../tekup-secrets/SUBCONTRACTOR_CONFIG_GUIDE.md"
  );
  console.log("");
  console.log("🔐 Next Steps After Migration:");
  console.log(
    "   1. Generate VAPID keys: cd backend-nestjs && npx web-push generate-vapid-keys"
  );
  console.log("   2. Add keys to .env: VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY");
  console.log(
    '   3. Create Supabase Storage bucket: "subcontractor-documents"'
  );
  console.log(
    "   4. Configure bucket policies (public read for verified documents)"
  );
  console.log("");
}

runMigration()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
