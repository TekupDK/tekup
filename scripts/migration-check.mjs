#!/usr/bin/env node
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const APPLY = args.includes("--apply");

dotenv.config({ path: path.join(__dirname, "..", ".env.prod") });
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error(
    "❌ DATABASE_URL not found. Ensure .env.prod exists and has DATABASE_URL"
  );
  process.exit(1);
}

const url = new URL(DATABASE_URL);
const client = new pg.Client({
  host: url.hostname,
  port: parseInt(url.port) || 5432,
  user: url.username,
  password: decodeURIComponent(url.password),
  database: url.pathname.split("/")[1],
  ssl: { rejectUnauthorized: false },
});

const outDir = path.join(__dirname, "..", "migration-check");
fs.mkdirSync(outDir, { recursive: true });
const BEFORE_PATH = path.join(outDir, "before.json");
const AFTER_PATH = path.join(outDir, "after.json");

async function countRows(client, schema, table) {
  const res = await client.query(
    `SELECT COUNT(*)::int AS c FROM ${schema}.${table}`
  );
  return res.rows[0]?.c ?? 0;
}

async function getColumns(client, schema, table) {
  const res = await client.query(
    `SELECT column_name, is_nullable, data_type
     FROM information_schema.columns
     WHERE table_schema=$1 AND table_name=$2
     ORDER BY ordinal_position`,
    [schema, table]
  );
  return res.rows;
}

async function getIndexes(client, schema, table) {
  const res = await client.query(
    `SELECT indexname
     FROM pg_indexes
     WHERE schemaname=$1 AND tablename=$2
     ORDER BY indexname`,
    [schema, table]
  );
  return res.rows.map(r => r.indexname);
}

async function tableExists(client, schema, table) {
  const res = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema=$1 AND table_name=$2
     ) AS exists`,
    [schema, table]
  );
  return !!res.rows[0]?.exists;
}

async function run() {
  console.log("🔎 Migration pre/post checks");
  await client.connect();

  const schema = "friday_ai";
  const tables = [
    "email_threads",
    "email_pipeline_state",
    "email_pipeline_transitions",
  ];

  // Pre-check: presence and counts (missing tables recorded as 0)
  const before = { when: new Date().toISOString(), schema, stats: {} };
  for (const t of tables) {
    const exists = await tableExists(client, schema, t);
    before.stats[t] = {
      exists,
      rows: exists ? await countRows(client, schema, t) : 0,
      columns: exists ? await getColumns(client, schema, t) : [],
      indexes: exists ? await getIndexes(client, schema, t) : [],
    };
  }
  fs.writeFileSync(BEFORE_PATH, JSON.stringify(before, null, 2));
  console.log(`✅ Pre-check saved: ${BEFORE_PATH}`);

  if (DRY_RUN) {
    console.log("ℹ️ Dry-run: not applying migration.");
  } else if (APPLY) {
    // Apply migration file
    const migrationPath = path.join(
      __dirname,
      "..",
      "drizzle",
      "migrations",
      "20251103_add_user_id_to_email_pipeline.sql"
    );
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }
    const sql = fs.readFileSync(migrationPath, "utf8");
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("COMMIT");
      console.log("✅ Migration applied");
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("❌ Migration failed and was rolled back:", e.message);
      process.exit(1);
    }
  }

  // Post-checks
  const after = { when: new Date().toISOString(), schema, stats: {} };
  for (const t of tables) {
    const exists = await tableExists(client, schema, t);
    after.stats[t] = {
      exists,
      rows: exists ? await countRows(client, schema, t) : 0,
      columns: exists ? await getColumns(client, schema, t) : [],
      indexes: exists ? await getIndexes(client, schema, t) : [],
    };
  }
  fs.writeFileSync(AFTER_PATH, JSON.stringify(after, null, 2));
  console.log(`✅ Post-check saved: ${AFTER_PATH}`);

  // Simple compare for row counts
  for (const t of tables) {
    const b = before.stats[t];
    const a = after.stats[t];
    if (!b.exists && a.exists) {
      console.log(`🆕 Table created: ${t}`);
    }
    if (b.rows !== a.rows) {
      console.log(`ℹ️ Row count changed for ${t}: ${b.rows} -> ${a.rows}`);
    }
  }

  // Assert columns on pipeline tables
  if (after.stats["email_pipeline_state"].exists) {
    const cols = after.stats["email_pipeline_state"].columns.map(
      c => c.column_name
    );
    if (!cols.includes("userId")) {
      console.warn("⚠️ email_pipeline_state.userId missing after migration");
      process.exitCode = 2;
    }
  }

  if (after.stats["email_pipeline_transitions"].exists) {
    const cols = after.stats["email_pipeline_transitions"].columns.map(
      c => c.column_name
    );
    if (!cols.includes("userId")) {
      console.warn(
        "⚠️ email_pipeline_transitions.userId missing after migration"
      );
      process.exitCode = 2;
    }
  }

  await client.end();
  console.log("🏁 Check complete");
}

run().catch(err => {
  console.error("❌ Check failed:", err);
  process.exit(1);
});
