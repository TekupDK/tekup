import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";
import * as fs from "fs";
import * as path from "path";

// Prefer environment provided by caller (dotenv-cli). Fallback to local files if missing.
if (!process.env.DATABASE_URL) {
  const prodPath = path.resolve(".env.prod");
  const devPath = path.resolve(".env.dev");
  const chosen = fs.existsSync(prodPath)
    ? prodPath
    : fs.existsSync(devPath)
      ? devPath
      : undefined;
  if (chosen) {
    dotenv.config({ path: chosen });
  }
}

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
// Ensure SSL works with Supabase self-signed certs
url.searchParams.set("sslmode", "no-verify");
const cleanUrl = url.toString();

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: cleanUrl,
    // Accept self-signed certificates (Supabase)
    ssl: { rejectUnauthorized: false },
  },
  schemaFilter: [schemaName], // Only process this schema
  verbose: true,
});
