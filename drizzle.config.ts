import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: ".env.supabase" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// Parse URL to get schema name
const url = new URL(connectionString);
const schemaParam = url.searchParams.get("schema");
const schemaName = schemaParam || "friday_ai";

// Remove schema from URL (postgres.js doesn't support it as query param)
url.searchParams.delete("schema");
const cleanUrl = url.toString();

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: cleanUrl,
    ssl: { rejectUnauthorized: false }, // Supabase uses self-signed certs
  },
  schemaFilter: [schemaName], // Only process this schema
  verbose: true,
});
