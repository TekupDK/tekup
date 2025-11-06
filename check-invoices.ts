import "dotenv/config";
import postgres from "postgres";

const dbUrl = new URL(process.env.DATABASE_URL!);
const schema = dbUrl.searchParams.get("schema") || "public";
dbUrl.searchParams.delete("schema");

const client = postgres(dbUrl.toString(), { ssl: false });

async function main() {
  try {
    await client`SET search_path TO ${client(schema)}`;

    const cols = await client`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'customer_invoices'
      ORDER BY ordinal_position
    `;

    if (cols.length > 0) {
      console.log(
        "✅ customer_invoices exists, columns:",
        cols.map(c => c.column_name)
      );
    } else {
      console.log("❌ customer_invoices does not exist");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

main();
