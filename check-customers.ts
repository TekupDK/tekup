import "dotenv/config";
import postgres from "postgres";

const dbUrl = new URL(process.env.DATABASE_URL!);
const schema = dbUrl.searchParams.get("schema") || "public";
dbUrl.searchParams.delete("schema");

const client = postgres(dbUrl.toString(), { ssl: false });

async function checkCustomersTable() {
  try {
    await client`SET search_path TO ${client(schema)}`;

    // Get columns from customers table
    const columns = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = ${schema}
        AND table_name = 'customers'
      ORDER BY ordinal_position
    `;

    console.log(`Columns in customers table:`);
    columns.forEach(c => {
      console.log(
        `  ${c.column_name}: ${c.data_type} (${c.is_nullable === "YES" ? "nullable" : "not null"})`
      );
    });

    // Sample row
    const sample = await client`SELECT * FROM customers LIMIT 1`;
    if (sample.length > 0) {
      console.log(`\nSample row:`);
      console.log(JSON.stringify(sample[0], null, 2));
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

checkCustomersTable();
