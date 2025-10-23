#!/usr/bin/env node
import fs from 'fs';
import os from 'os';
import path from 'path';
import http from 'http';

const MCP_URL = process.env.MCP_URL || 'http://localhost:3001';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

async function run() {
  const now = new Date();
  const outDir = path.join(process.cwd(), 'snapshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const snapshot = {
    createdAt: now.toISOString(),
    host: os.hostname(),
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    process: {
      pid: process.pid,
      cwd: process.cwd(),
      memoryMB: Object.fromEntries(
        Object.entries(process.memoryUsage()).map(([k, v]) => [k, Math.round(v / 1024 / 1024)])
      ),
      uptimeSeconds: Math.round(process.uptime()),
    },
    system: {
      cpus: os.cpus().length,
      totalMemMB: Math.round(os.totalmem() / 1024 / 1024),
      freeMemMB: Math.round(os.freemem() / 1024 / 1024),
      loadAvg: os.loadavg(),
    },
    mcp: {},
  };

  try {
    snapshot.mcp.health = await fetchJson(`${MCP_URL}/health`);
  } catch (e) {
    snapshot.mcp.health = { error: String(e) };
  }

  try {
    snapshot.mcp.diagnostics = await fetchJson(`${MCP_URL}/diagnostics/snapshot`);
  } catch (e) {
    snapshot.mcp.diagnostics = { error: String(e) };
  }

  const file = path.join(outDir, `snapshot-${now.toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(file, JSON.stringify(snapshot, null, 2));
  console.log(`Snapshot written: ${file}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});


