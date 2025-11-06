import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();

  // Check email_threads columns
  const result = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'friday_ai' 
    AND table_name = 'email_threads' 
    ORDER BY ordinal_position
  `);

  console.log("\n📊 Columns in email_threads table:");
  result.rows.forEach(row => {
    console.log(`  - ${row.column_name}`);
  });

  // Check users table
  const usersResult = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'friday_ai' 
    AND table_name = 'users' 
    ORDER BY ordinal_position
  `);

  console.log("\n📊 Columns in users table:");
  usersResult.rows.forEach(row => {
    console.log(`  - ${row.column_name}`);
  });

  // Check leads table
  const leadsResult = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'friday_ai' 
    AND table_name = 'leads' 
    ORDER BY ordinal_position
  `);

  console.log("\n📊 Columns in leads table:");
  leadsResult.rows.forEach(row => {
    console.log(`  - ${row.column_name}`);
  });
} catch (error) {
  console.error("Error:", error.message);
} finally {
  await client.end();
}
