const { Pool } = require("pg");

console.log("🔍 Testing Supabase Session Pooler (recommended for Prisma)...\n");

// Try Session Mode pooler (port 6543)
const pool = new Pool({
  host: "aws-0-eu-central-1.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  user: "postgres.oaevagdgrasfppbrxbey",
  password: "tfXJPxcQYElxUfqC",
  ssl: { rejectUnauthorized: false },
});

pool
  .query(
    "SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1",
    ["renos"]
  )
  .then((result) => {
    if (result.rows.length > 0) {
      console.log("✅ SUCCESS! Connected via Session Pooler\n");
      console.log("✅ renos schema EXISTS!\n");

      // Test counting tables
      return pool.query(`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'renos'
      `);
    } else {
      console.log("❌ Connected but renos schema NOT FOUND");
      process.exit(1);
    }
  })
  .then((result) => {
    console.log(
      `📊 Found ${result.rows[0].table_count} tables in renos schema`
    );

    // List table names
    return pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'renos'
      ORDER BY table_name
    `);
  })
  .then((result) => {
    console.log("\n📋 Tables:");
    result.rows.forEach((row) => console.log(`  - ${row.table_name}`));
    console.log("\n🎉 Database is ready for backend connection!\n");

    // Show connection string format
    console.log("📝 Use this connection string in .env:");
    console.log(
      'DATABASE_URL="postgresql://postgres.oaevagdgrasfppbrxbey:tfXJPxcQYElxUfqC@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?schema=renos&pgbouncer=true&connection_limit=1"\n'
    );

    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.log("❌ Pooler Error:", error.message);
    console.log("Code:", error.code);
    console.log(
      "\n⚠️  Session pooler also fails. Need correct connection string from Supabase Dashboard."
    );
    pool.end();
    process.exit(1);
  });
