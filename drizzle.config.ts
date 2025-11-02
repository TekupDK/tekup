import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// Parse connection string for SSL configuration
const url = new URL(connectionString.replace(/^postgresql:\/\//, "https://"));
const sslMode = url.searchParams.get("sslmode") || "require";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
    ssl: sslMode === "require" || sslMode === "prefer" ? { rejectUnauthorized: false } : undefined,
  },
});
