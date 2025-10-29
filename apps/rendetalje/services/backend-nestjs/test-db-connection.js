const { Pool } = require("pg");

// Test WITHOUT schema parameter to see if we can connect at all
const pool = new Pool({
  connectionString:
    "postgresql://postgres:tfXJPxcQYElxUfqC@52.59.152.35:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

console.log("🔍 Testing database connection WITHOUT schema parameter...\n");

pool
  .query(
    "SELECT schema_name FROM information_schema.schemata ORDER BY schema_name"
  )
  .then((result) => {
    console.log("✅ CONNECTION SUCCESSFUL!\n");
    console.log("Available schemas in database:");
    result.rows.forEach((row) => {
      console.log(`  - ${row.schema_name}`);
    });

    const hasRenos = result.rows.some((row) => row.schema_name === "renos");
    console.log("\n📊 Analysis:");
    console.log(
      `  Renos schema exists? ${hasRenos ? "✅ YES" : "❌ NO - MUST BE CREATED!"}`
    );

    if (!hasRenos) {
      console.log("\n⚠️  ROOT CAUSE IDENTIFIED:");
      console.log('  The "renos" schema does not exist in the database!');
      console.log("  Prisma migrations have never been run.");
      console.log("\n📝 Solution:");
      console.log("  1. Create schema: CREATE SCHEMA IF NOT EXISTS renos;");
      console.log("  2. Run migration: npx prisma migrate deploy");
    }

    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.log("❌ CONNECTION FAILED!\n");
    console.log(`Error: ${error.message}`);
    console.log(`Code: ${error.code}`);
    console.log(`Severity: ${error.severity || "N/A"}`);

    if (error.code === "XX000") {
      console.log('\n⚠️  Error XX000 = "Tenant or user not found"');
      console.log("This is a Supabase-specific error. Possible causes:");
      console.log("  1. Wrong project ID");
      console.log("  2. Wrong password");
      console.log("  3. Database not fully initialized after Pro upgrade");
      console.log("  4. Need to use Supabase Dashboard to verify credentials");
    }

    pool.end();
    process.exit(1);
  });
