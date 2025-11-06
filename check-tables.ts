import "dotenv/config";
import postgres from "postgres";

const dbUrl = new URL(process.env.DATABASE_URL!);
const schema = dbUrl.searchParams.get("schema") || "public";
dbUrl.searchParams.delete("schema");

const client = postgres(dbUrl.toString(), { ssl: false });

async function checkTables() {
  try {
    // Set search path
    await client`SET search_path TO ${client(schema)}`;

    // Check if customer_profiles exists
    const result = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ${schema}
        AND table_name = 'customer_profiles'
    `;

    if (result.length > 0) {
      console.log(`✅ Table customer_profiles exists in schema ${schema}`);
    } else {
      console.log(`❌ Table customer_profiles NOT found in schema ${schema}`);

      // List all tables in the schema
      const allTables = await client`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = ${schema}
        ORDER BY table_name
      `;

      console.log(`\nTables in ${schema}:`);
      allTables.forEach(t => console.log(`  - ${t.table_name}`));
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

checkTables();
