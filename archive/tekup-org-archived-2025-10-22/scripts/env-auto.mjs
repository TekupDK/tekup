#!/usr/bin/env node
// Env/keys automation for TekUp monorepo (apps/*)
// - Ensures .env.local per app
// - For API (NestJS): ensure JWT_SECRET (generate if missing), DATABASE_URL (defaults to local)
// - For Web (Next.js): ensure NEXT_PUBLIC_API_URL (tries to infer sibling API port)

import { readdirSync, statSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join, basename } from 'path';
import { randomBytes } from 'crypto';

const ROOT = process.cwd();
const APPS_DIR = join(ROOT, 'apps');

function log(msg) {
  // eslint-disable-next-line no-console
  console.log(`[env-auto] ${msg}`);
}

function safeRead(path) {
  try { return readFileSync(path, 'utf-8'); } catch { return ''; }
}

function ensureLine(content, key, makeValue) {
  const has = new RegExp(`^${key}=`, 'm').test(content);
  if (has) return content;
  const value = makeValue();
  const line = `${key}=${value}`;
  return content ? content.replace(/\n*$/,'') + `\n${line}\n` : line + '\n';
}

function findNestPort(appPath) {
  const mainTs = join(appPath, 'src', 'main.ts');
  const content = safeRead(mainTs);
  const m = content.match(/listen\((\d{2,5})\)/);
  return m ? Number(m[1]) : null;
}

function processApiApp(appPath, appName) {
  const envLocal = join(appPath, '.env.local');
  const envFile = existsSync(envLocal) ? envLocal : join(appPath, '.env');
  let content = safeRead(envFile);

  const dbName = appName.replace(/[^a-zA-Z0-9_\-]/g, '_');
  content = ensureLine(content, 'DATABASE_URL', () => `postgresql://postgres:postgres@localhost:5432/${dbName}`);
  content = ensureLine(content, 'JWT_SECRET', () => randomBytes(64).toString('base64url'));
  content = ensureLine(content, 'JWT_EXPIRES_IN', () => '1h');

  writeFileSync(envFile, content, { encoding: 'utf-8' });
}

function processWebApp(appPath, appName) {
  const envLocal = join(appPath, '.env.local');
  const envFile = existsSync(envLocal) ? envLocal : join(appPath, '.env');
  let content = safeRead(envFile);

  // Try to map sibling API folder by replacing -web -> -api
  let port = null;
  if (/-web$/.test(appName)) {
    const siblingApiName = appName.replace(/-web$/, '-api');
    const siblingApiPath = join(APPS_DIR, siblingApiName);
    if (existsSync(siblingApiPath)) {
      port = findNestPort(siblingApiPath);
    }
  }
  const apiUrl = `http://localhost:${port || 3002}/api`;

  content = ensureLine(content, 'NEXT_PUBLIC_API_URL', () => apiUrl);
  writeFileSync(envFile, content, { encoding: 'utf-8' });
}

function detectAppKind(appPath) {
  const pkgPath = join(appPath, 'package.json');
  if (!existsSync(pkgPath)) return 'unknown';
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  if (deps.next) return 'web';
  if (deps['@nestjs/core']) return 'api';
  return 'unknown';
}

function main() {
  if (!existsSync(APPS_DIR)) {
    log('No apps directory found. Skipping.');
    return;
  }
  const entries = readdirSync(APPS_DIR).map(name => ({ name, path: join(APPS_DIR, name) }))
    .filter(e => statSync(e.path).isDirectory());

  for (const e of entries) {
    const kind = detectAppKind(e.path);
    if (kind === 'api') {
      log(`Configuring API app ${e.name}`);
      processApiApp(e.path, e.name);
    } else if (kind === 'web') {
      log(`Configuring Web app ${e.name}`);
      processWebApp(e.path, e.name);
    } else {
      // skip unknown
    }
  }
  log('Completed env automation.');
}

try { main(); } catch (err) { console.error(err); process.exit(1); }

