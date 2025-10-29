// Create Supabase Storage bucket using service role key
// Usage: node create-supabase-bucket.mjs subcontractor-documents [public|private]
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const bucketName = args[0] || "subcontractor-documents";
const isPublic = (args[1] || "private").toLowerCase() === "public";

// Read env from backend NestJS .env
const envPath = path.resolve("../backend-nestjs/.env");
if (!fs.existsSync(envPath)) {
  console.error(`Could not find .env at ${envPath}`);
  process.exit(1);
}
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((l) => !l.trim().startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL = env["SUPABASE_URL"];
const SUPABASE_SERVICE_KEY = env["SUPABASE_SERVICE_KEY"];
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in backend .env");
  process.exit(1);
}

const endpoint = `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/bucket`;

async function main() {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      apikey: SUPABASE_SERVICE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: bucketName, public: isPublic }),
  });

  const text = await res.text();
  if (res.ok) {
    console.log(
      `✅ Bucket '${bucketName}' created (${isPublic ? "public" : "private"})`
    );
  } else if (res.status === 409 || /already exists/i.test(text)) {
    console.log(
      `ℹ️ Bucket '${bucketName}' already exists (status ${res.status})`
    );
  } else {
    console.error(
      `❌ Failed to create bucket: ${res.status} ${res.statusText}\n${text}`
    );
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
