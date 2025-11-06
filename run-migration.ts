import "dotenv/config";
import postgres from "postgres";
import { readFileSync } from "fs";

const dbUrl = new URL(process.env.DATABASE_URL!);
dbUrl.searchParams.delete("schema");

const client = postgres(dbUrl.toString(), { ssl: false });

async function runMigration() {
  try {
    const sql = readFileSync(
      "drizzle/migrations/create-customer-profiles.sql",
      "utf-8"
    );
    await client.unsafe(sql);
    console.log("✅ Migration completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration();
