const { Pool } = require("pg");

console.log("🔍 Testing NEW password connection to Supabase...\n");

const pool = new Pool({
  connectionString:
    "postgresql://postgres:Habibie12345%40@db.oaevagdgrasfppbrxbey.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

pool
  .query("SELECT version(), current_database(), current_user")
  .then((result) => {
    console.log("✅ CONNECTION SUCCESSFUL!\n");
    console.log("PostgreSQL:", result.rows[0].version.substring(0, 50));
    console.log("Database:", result.rows[0].current_database);
    console.log("User:", result.rows[0].current_user);

    // Now check for renos schema
    return pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'renos'
    `);
  })
  .then((result) => {
    if (result.rows.length > 0) {
      console.log("\n✅ renos schema EXISTS!");

      // Count tables in renos
      return pool.query(`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'renos'
      `);
    } else {
      console.log("\n❌ renos schema NOT FOUND!");
      process.exit(1);
    }
  })
  .then((result) => {
    console.log(
      `✅ Found ${result.rows[0].table_count} tables in renos schema`
    );

    // List tables
    return pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'renos'
      ORDER BY table_name
    `);
  })
  .then((result) => {
    console.log("\n📋 Tables in renos schema:");
    result.rows.forEach((row) => console.log(`  - ${row.table_name}`));

    console.log("\n🎉 DATABASE IS READY! Backend can now connect!\n");
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.log("❌ CONNECTION FAILED!\n");
    console.log("Error:", error.message);
    console.log("Code:", error.code);

    if (error.code === "XX000") {
      console.log("\n⚠️  Still getting XX000 error!");
      console.log(
        "Wait 30 seconds for Supabase to update password, then try again."
      );
    } else if (error.code === "ENOTFOUND") {
      console.log("\n⚠️  DNS resolution failed. Try again in a moment.");
    }

    pool.end();
    process.exit(1);
  });
