#!/usr/bin/env node
/**
 * TekUp Unified Health Scanner (Enhanced)
 * HTTP + optional TCP (databases, caches) health scanner with:
 *  - Concurrency
 *  - Timeout control
 *  - Registry auto-discovery (YAML)
 *  - JSON output
 *  - Strict CI mode (non‑zero exit when failures)
 *  - TCP inclusion flags (--include-tcp / --tcp-only)
 */

import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { performance } from 'node:perf_hooks';
import { argv, exit } from 'node:process';
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_TIMEOUT = 5000;
const DEFAULT_CONCURRENCY = 6;

const SERVICE_REGISTRY = {
  'flow-api': { type: 'http', url: 'http://localhost:4000/health' },
  'tekup-crm-api': { type: 'http', url: 'http://localhost:4001/health' },
  'lead-platform-api': { type: 'http', url: 'http://localhost:4002/health' },
  'voice-agent': { type: 'http', url: 'http://localhost:4003/health' },
  'mcp-studio-api': { type: 'http', url: 'http://localhost:4004/health' },
  'flow-web': { type: 'http', url: 'http://localhost:3000' },
  'tekup-crm-web': { type: 'http', url: 'http://localhost:3001' },
  'website': { type: 'http', url: 'http://localhost:8080' },
};

function parseSimpleYaml(content) {
  const lines = content.replace(/\r/g, '').split(/\n/);
  const root = {};
  const stack = [{ indent: -1, obj: root }];
  for (const rawLine of lines) {
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue;
    const indent = rawLine.match(/^\s*/)[0].length;
    const line = rawLine.trim();
    while (stack.length && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].obj;
    if (/^-\s+/.test(line)) continue; // arrays not required here
    const kv = line.match(/^([A-Za-z0-9_\-]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let value = kv[2];
    if (!value) {
      const child = {};
      parent[key] = child;
      stack.push({ indent, obj: child });
    } else {
      if (/^".*"$/.test(value) || /^'.*'$/.test(value)) value = value.slice(1, -1);
      else if (/^\d+$/.test(value)) value = Number(value);
      parent[key] = value;
    }
  }
  return root;
}

function loadRegistryServices(registryPath, environment = 'development') {
  try {
    const abs = path.resolve(registryPath);
    if (!fs.existsSync(abs)) return {};
    const raw = fs.readFileSync(abs, 'utf8');
    const yaml = parseSimpleYaml(raw);
    if (!yaml.services) return {};
    const out = {};
    for (const [name, cfg] of Object.entries(yaml.services)) {
      if (!cfg || !cfg.environments) continue;
      const port = cfg.environments[environment];
      if (!port) continue;
      const protocol = cfg.protocol || 'http';
      const health = cfg.health_endpoint || '/health';
      if (protocol === 'http' || protocol === 'https') {
        const pathPart = health.startsWith('/') ? health : `/${health}`;
        out[name] = { type: 'http', url: `${protocol}://localhost:${port}${pathPart === '/' ? '' : pathPart}` };
      } else if (protocol === 'tcp') {
        out[name] = { type: 'tcp', host: 'localhost', port };
      }
    }
    return out;
  } catch {
    return {};
  }
}

function parseArgs() {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) args[key] = true; else { args[key] = next; i++; }
    }
  }
  return args;
}

const args = parseArgs();
const asJson = Boolean(args.json);
const detailed = Boolean(args.detailed);
const noColor = Boolean(args.raw) || asJson;
const strict = Boolean(args.strict);
const environment = args.env || 'development';
const registryFile = args.registry || 'config/ports/registry.yaml';
const includeTcp = Boolean(args['include-tcp']);
const tcpOnly = Boolean(args['tcp-only']);
const timeoutMs = args.timeout ? Number(args.timeout) : DEFAULT_TIMEOUT;
const concurrency = args.concurrency ? Number(args.concurrency) : DEFAULT_CONCURRENCY;
const repeat = args.repeat ? Number(args.repeat) : 0;

if (!args['no-registry']) {
  const dynamic = loadRegistryServices(registryFile, environment);
  for (const [k, v] of Object.entries(dynamic)) if (!SERVICE_REGISTRY[k]) SERVICE_REGISTRY[k] = v;
}

let selectedServices = Object.keys(SERVICE_REGISTRY);
if (args.services) selectedServices = args.services.split(',').map(s => s.trim()).filter(Boolean);
if (args.url) { selectedServices = []; SERVICE_REGISTRY.__adhoc = { type: 'http', url: args.url }; selectedServices.push('__adhoc'); }

const colors = noColor ? { reset: '', red: '', green: '', yellow: '', gray: '', cyan: '', bold: '' } : {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', gray: '\x1b[90m', cyan: '\x1b[36m', bold: '\x1b[1m'
};
const colorize = (c, t) => colors[c] + t + colors.reset;

function httpRequest(url, timeout) {
  return new Promise(resolve => {
    const start = performance.now();
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout }, res => {
      res.on('data', () => {});
      res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, time: performance.now() - start, headers: detailed ? res.headers : undefined }));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', err => resolve({ ok: false, error: err.message, status: 0, time: performance.now() - start }));
  });
}

async function executeWithConcurrency(tasks, limit) {
  const results = new Array(tasks.length); let index = 0; let active = 0;
  return new Promise(resolve => {
    function next() {
      if (index === tasks.length && active === 0) return resolve(results);
      while (active < limit && index < tasks.length) {
        const cur = index++; active++;
        tasks[cur]().then(r => { results[cur] = r; }).catch(e => { results[cur] = { error: e.message }; }).finally(() => { active--; next(); });
      }
    }
    next();
  });
}

async function scanOnce() {
  const timestamp = new Date().toISOString();
  const tasks = selectedServices.map(name => async () => {
    const def = SERVICE_REGISTRY[name]; if (!def) return { service: name, error: 'unknown-service' };
    const defType = def.type || (def.url ? 'http' : 'tcp');
    if (tcpOnly && defType !== 'tcp') return { service: name, skipped: true };
    if (!includeTcp && !tcpOnly && defType === 'tcp') return { service: name, skipped: true };
    if (defType === 'tcp') {
      const start = performance.now();
      const res = await new Promise(resolve => {
        const socket = net.createConnection({ host: def.host || 'localhost', port: def.port });
        let done = false;
        const timer = setTimeout(() => { if (done) return; done = true; socket.destroy(); resolve({ ok: false, error: 'timeout', status: 0 }); }, timeoutMs);
        socket.once('connect', () => { if (done) return; done = true; clearTimeout(timer); socket.end(); resolve({ ok: true, status: 0 }); });
        socket.once('error', err => { if (done) return; done = true; clearTimeout(timer); socket.destroy(); resolve({ ok: false, error: err.message, status: 0 }); });
      });
      return { service: name, type: 'tcp', host: def.host || 'localhost', port: def.port, time: performance.now() - start, ...res };
    }
    const result = await httpRequest(def.url, timeoutMs);
    return { service: name, type: 'http', url: def.url, ...result };
  });

  const results = await executeWithConcurrency(tasks, concurrency);
  const summary = {
    timestamp,
    total: results.length,
    healthy: results.filter(r => r.ok && !r.skipped).length,
    unhealthy: results.filter(r => !r.ok && !r.skipped).length,
    skipped: results.filter(r => r.skipped).length,
    timeoutMs,
    services: results,
    strictFailed: false,
    tcpIncluded: includeTcp || tcpOnly,
    tcpOnly,
  };
  if (strict && summary.unhealthy > 0) summary.strictFailed = true;
  if (asJson) { console.log(JSON.stringify(summary, null, 2)); return summary; }
  console.log(colorize('cyan', `\nTekUp Health Scan @ ${timestamp}`));
  console.log(colorize('gray', `Services: ${selectedServices.join(', ')}  Timeout: ${timeoutMs}ms  Concurrency: ${concurrency}`));
  for (const r of results) {
    if (r.skipped) { if (detailed) console.log(colorize('gray', `SKIP ${r.service}`)); continue; }
    const statusLine = r.ok ? colorize('green', 'OK') : colorize('red', 'FAIL');
    const time = r.time != null ? `${Math.round(r.time)}ms` : '-';
    const target = r.type === 'tcp' ? `${r.host}:${r.port}` : r.url;
    const extra = r.error ? colorize('yellow', r.error) : (r.type === 'http' ? `HTTP ${r.status}` : 'TCP');
    console.log(`${statusLine} ${colorize('bold', r.service.padEnd(18))} ${time.padStart(6)}  ${target}  ${extra}`);
  }
  console.log(colorize('cyan', `Summary: healthy=${summary.healthy} unhealthy=${summary.unhealthy} skipped=${summary.skipped}`));
  if (strict && summary.strictFailed) setTimeout(() => exit(2), 10);
  return summary;
}

async function main() {
  if (repeat > 0) {
    while (true) { // eslint-disable-line no-constant-condition
      await scanOnce();
      await new Promise(r => setTimeout(r, repeat * 1000));
    }
  } else {
    await scanOnce();
  }
}

main().catch(err => { console.error('Health scan failed:', err); exit(1); });
