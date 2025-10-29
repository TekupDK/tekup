#!/usr/bin/env node
/**
 * Safe Prisma push: generate SQL diff and strip destructive changes
 * - Keeps CREATE TABLE/INDEX/SCHEMA, ADD COLUMN, CREATE TYPE, etc.
 * - Removes DROP TABLE/INDEX/VIEW/CONSTRAINT, DROP COLUMN, ALTER TYPE
 */
const { execSync, spawnSync } = require("child_process");

function run(cmd, opts = {}) {
  const res = spawnSync(cmd, { shell: true, encoding: "utf8", ...opts });
  if (res.error) throw res.error;
  if (res.status !== 0) {
    throw new Error(res.stderr || res.stdout || `Command failed: ${cmd}`);
  }
  return res.stdout;
}

try {
  process.chdir(__dirname);
  require("dotenv").config();
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL not found in environment/.env");
  console.log("🔎 Generating Prisma SQL diff...");
  const diffCmd = `npx prisma migrate diff --from-url \"${process.env.DATABASE_URL}\" --to-schema-datamodel ./prisma/schema.prisma --script`;
  const sql = run(diffCmd, { env: process.env });

  // Split into SQL statements at semicolons
  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const keep = [];
  const destructive = [
    /\bDROP\b/i,
    /ALTER\s+TABLE\s+[^;]+\s+DROP\s+COLUMN/i,
    /ALTER\s+TABLE\s+[^;]+\s+ALTER\s+COLUMN/i,
  ];
  const protectRenos =
    /ALTER\s+TABLE\s+renos\.(subcontractor|push_subscriptions|task_assignments|services)/i;
  const excludeSchemas =
    /((\"vault\"\.)|(\bvault\b)|SCHEMA\s+vault\b|IN\s+SCHEMA\s+vault\b)/i;

  let skipped = 0;
  for (let stmt of statements) {
    if (
      destructive.some((re) => re.test(stmt)) ||
      protectRenos.test(stmt) ||
      excludeSchemas.test(stmt)
    ) {
      skipped++;
      continue;
    }
    keep.push(stmt.endsWith(";") ? stmt : stmt + ";");
  }

  const safeSql = keep.join("\n").trim();
  if (!safeSql) {
    console.log("✅ No non-destructive changes to apply.");
    process.exit(0);
  }

  console.log(
    `🧹 Filtered out ${skipped} destructive lines. Applying safe changes...`
  );

  const preSql = [
    "CREATE SCHEMA IF NOT EXISTS vault;",
    "CREATE SCHEMA IF NOT EXISTS billy;",
    "CREATE SCHEMA IF NOT EXISTS crm;",
    "CREATE SCHEMA IF NOT EXISTS flow;",
    "CREATE SCHEMA IF NOT EXISTS shared;",
  ].join("\n");

  let execRes = spawnSync(
    "npx prisma db execute --stdin --schema ./prisma/schema.prisma",
    {
      shell: true,
      env: process.env,
      input: preSql,
      stdio: ["pipe", "inherit", "inherit"],
    }
  );
  if (execRes.status !== 0) {
    process.exit(execRes.status);
  }

  const fs = require("fs");
  fs.writeFileSync("safe.sql", safeSql, "utf8");
  const vaultRefs = safeSql.split(/\r?\n/).filter((l) => /vault/i.test(l));
  if (vaultRefs.length) {
    console.log('ℹ️ Remaining statements containing "vault":');
    for (const l of vaultRefs) console.log("  ", l);
  }

  execRes = spawnSync(
    "npx prisma db execute --stdin --schema ./prisma/schema.prisma",
    {
      shell: true,
      env: process.env,
      input: safeSql,
      stdio: ["pipe", "inherit", "inherit"],
    }
  );
  if (execRes.status !== 0) {
    process.exit(execRes.status);
  }
  console.log("🎉 Safe push applied successfully.");
} catch (e) {
  console.error("❌ Safe push failed:", e.message);
  process.exit(1);
}
